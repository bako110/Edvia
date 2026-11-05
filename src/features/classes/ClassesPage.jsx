import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Empty } from '../../components/ui/Common'
import { Field } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useRun } from '../../hooks/useRun'
import { classesApi } from '../../api'
import { CL } from '../../lib/calc'

// Création d’une classe : réservée à l’administration
function NewClasse({ existing, onCreated }) {
  const run = useRun()
  const [open, setOpen] = useState(existing.length === 0)
  const [preset, setPreset] = useState('')
  const [custom, setCustom] = useState('')
  const free = CL.filter(c => !existing.includes(c))
  const name = (custom || preset).trim()

  const create = async () => {
    const r = await run(() => classesApi.create(name), `Classe « ${name} » créée`)
    if (r) { setPreset(''); setCustom(''); onCreated(r.id) }
  }
  return (
    <section className="card">
      <button className="fold" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <h2><Icon name="plus" /> Nouvelle classe</h2><Icon name={open ? 'chev-down' : 'chev-right'} size={18} />
      </button>
      {open && <>
      <div className="mut">Chaque nouvelle classe reçoit les matières usuelles (modifiables ensuite).</div>
      <div className="row mrow">
        <Picker label="Niveau" title="Choisir un niveau" columns={3} value={preset}
          options={[{ value: '', label: 'Niveau…' }, ...free.map(c => ({ value: c, label: c }))]} onChange={v => { setPreset(v); setCustom('') }} />
        <Field placeholder="ou nom libre (ex. 6è B)" value={custom} onChange={e => { setCustom(e.target.value); setPreset('') }} maxLength={30} />
      </div>
      <button className="btn p" disabled={!name} onClick={create}><Icon name="plus" size={16} /> Créer la classe</button>
      </>}
    </section>
  )
}

export default function ClassesPage() {
  const { user } = useAuth()
  const { classes, loading, error, reload } = useClasses()
  const nav = useNavigate()
  const isAdmin = user.role === 'admin'

  return <>
    {isAdmin && !loading && <NewClasse existing={classes.map(c => c.name)} onCreated={id => { reload(); nav(`/classes/${id}`) }} />}

    <Async loading={loading} error={error} onRetry={reload}>
      {classes.length === 0
        ? <Empty icon="school" title="Aucune classe" text={isAdmin ? 'Créez votre première classe ci-dessus.' : 'Aucune classe ne vous est affectée pour le moment.'} />
        : (
          <section className="card">
            <h2><Icon name="school" /> {isAdmin || user.role === 'staff' ? 'Classes de l’établissement' : 'Mes classes'} <span className="count">{classes.length}</span></h2>
            <div className="clist">
              {classes.map((c, i) => (
                <Link to={`/classes/${c.id}`} className="ccard" key={c.id} style={{ '--k': Math.min(i, 10) }}>
                  <div className="ccard-name">{c.name}</div>
                  <div className="mut">{c.nbEleves} élève{c.nbEleves > 1 ? 's' : ''} · {c.nbMatieres} matière{c.nbMatieres > 1 ? 's' : ''}</div>
                  {c.principal && <div className="mut"><Icon name="shield" size={13} /> {c.principal.name}</div>}
                  <Icon name="chev-right" size={18} className="ccard-go" />
                </Link>
              ))}
            </div>
          </section>
        )}
    </Async>
  </>
}
