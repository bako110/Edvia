import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Empty } from '../../components/ui/Common'
import { Field } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useConfirm, useToast } from '../../context/Feedback'
import { useClasse } from '../../hooks/useClasse'
import { useRun } from '../../hooks/useRun'
import { classesApi, elevesApi, usersApi } from '../../api'
import { num, TR } from '../../lib/calc'
import { usePaged } from '../../hooks/usePaged'
import { smartFilter } from '../../lib/search'
import { Hl, SearchBox, ListNav } from '../../components/ui/ListTools'
import ImportEleves from './ImportEleves'

/* ---------- matières + enseignants (administrateur) ---------- */
function Matieres({ classe, teachers, editable, onChange }) {
  const run = useRun(), confirm = useConfirm()
  const opts = [{ value: '', label: 'Aucun enseignant' }, ...teachers.map(t => ({ value: t.id, label: t.name }))]
  const [draft, setDraft] = useState({ name: '', coef: '2' })

  const update = (m, data) => run(() => classesApi.updateMatiere(classe.id, m.id, data)).then(onChange)
  const remove = async m => {
    if (!(await confirm({ danger: true, ok: 'Supprimer', title: `Supprimer « ${m.n} » ?`, text: 'Les notes saisies dans cette matière seront définitivement perdues.' }))) return
    await run(() => classesApi.removeMatiere(classe.id, m.id), 'Matière supprimée'); onChange()
  }
  const add = async () => {
    if (await run(() => classesApi.addMatiere(classe.id, { name: draft.name, coef: num(draft.coef) || 1 }), 'Matière ajoutée')) { setDraft({ name: '', coef: '2' }); onChange() }
  }

  return (
    <section className="card">
      <h2><Icon name="book" /> Matières{editable ? ' et enseignants' : ''} <span className="count">{classe.matieres.length}</span></h2>
      {editable && <div className="mut">Chaque matière est confiée à <b>un enseignant</b> : lui seul pourra saisir ces notes pour cette classe.</div>}
      {classe.matieres.map(m => (
        <div className="mat-row" key={m.id}>
          {editable
            ? <>
              <input defaultValue={m.n} aria-label="Matière" onBlur={e => e.target.value.trim() && e.target.value !== m.n && update(m, { name: e.target.value })} />
              <input type="number" min="0.5" step="0.5" defaultValue={m.c} aria-label="Coefficient" className="coef"
                onBlur={e => num(e.target.value) > 0 && num(e.target.value) !== m.c && update(m, { coef: num(e.target.value) })} />
              <Picker label="Enseignant" title={`Enseignant — ${m.n}`} value={m.teacherId || ''} options={opts}
                onChange={v => update(m, { teacher: v || null })} />
              <button className="btn icon-btn sm" disabled={classe.matieres.length < 2} onClick={() => remove(m)} aria-label="Supprimer la matière"><Icon name="close" size={16} /></button>
            </>
            : <><b>{m.n}</b><span className="mut">coef {m.c}</span><span className={'tag ' + (m.teacherName ? '' : 'gold')}>{m.teacherName || 'sans enseignant'}</span></>}
        </div>
      ))}
      {editable && (
        <div className="mat-row add">
          <input placeholder="Nouvelle matière" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
          <input type="number" min="0.5" step="0.5" className="coef" value={draft.coef} onChange={e => setDraft(d => ({ ...d, coef: e.target.value }))} aria-label="Coefficient" />
          <button className="btn" disabled={!draft.name.trim()} onClick={add}><Icon name="plus" size={16} /> Ajouter</button>
        </div>
      )}
    </section>
  )
}

/* ---------- verrouillage des trimestres (administrateur) ---------- */
function Locks({ classe, isAdmin, onChange }) {
  const run = useRun(), confirm = useConfirm()
  const toggle = async tr => {
    const lock = !classe.locked[tr]
    const ok = await confirm({ danger: !lock, ok: lock ? 'Verrouiller' : 'Déverrouiller', title: `${lock ? 'Verrouiller' : 'Déverrouiller'} le ${TR[tr]} ?`,
      text: lock ? 'Plus aucune note ni pénalité ne pourra être modifiée dans cette classe pour ce trimestre, par personne.' : 'Les notes de ce trimestre redeviennent modifiables. Cette action est enregistrée dans le journal d’audit.' })
    if (ok && await run(() => classesApi.setLock(classe.id, tr, lock), lock ? 'Trimestre verrouillé' : 'Trimestre déverrouillé')) onChange()
  }
  return (
    <section className="card">
      <h2><Icon name="lock" /> Verrouillage des notes</h2>
      <p className="mut">Une fois le conseil de classe terminé, verrouillez le trimestre : les notes et les pénalités ne peuvent plus être modifiées, ce qui protège les moyennes et les bulletins.</p>
      <div className="locks">
        {TR.map((t, i) => (
          <button key={t} className={'lockbtn' + (classe.locked[i] ? ' on' : '')} onClick={() => toggle(i)} aria-pressed={classe.locked[i]} disabled={classe.locked[i] && !isAdmin} title={classe.locked[i] && !isAdmin ? 'Seul l’administrateur peut déverrouiller' : undefined}>
            <Icon name={classe.locked[i] ? 'lock' : 'key'} size={20} /><b>{t}</b><span>{classe.locked[i] ? (isAdmin ? 'Verrouillé' : 'Verrouillé · admin seul') : 'Ouvert'}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/* ---------- élèves : liste légère (recherche, affichage par paquets) — un clic ouvre la fiche de l’élève ---------- */
function Eleves({ classe, canManage }) {
  const [q, setQ] = useState('')
  const found = smartFilter(classe.eleves.map((e, i) => ({ e, i })), q, ({ e }) => `${e.n} ${e.matricule || ''}`)
  const rows = found.items
  const list = usePaged(rows, { size: 20, resetKey: q + classe.id })
  return (
    <section className="card">
      <h2><Icon name="users" /> Élèves de la classe <span className="count">{classe.eleves.length}</span></h2>
      {!canManage && classe.eleves.length > 0 && <p className="mut"><Icon name="info" size={14} /> Liste enregistrée par l’administration. Touchez un élève pour voir sa fiche.</p>}
      {classe.eleves.length > 8 && <SearchBox value={q} onChange={setQ} count={rows.length} total={classe.eleves.length} fuzzy={found.fuzzy} />}
      {classe.eleves.length === 0 && <p className="mut center">{canManage ? 'Aucun élève : utilisez l’import ou la saisie ci-dessus.' : 'L’administration n’a pas encore enregistré les élèves de cette classe.'}</p>}
      <ol className="slist">
        {list.shown.map(({ e, i }) => (
          <li key={e.id}>
            <Link className="srow" to={`/classes/${classe.id}/eleves/${e.id}`}>
              <span className="nidx">{i + 1}</span>
              <span className="sname"><b><Hl text={e.n} q={q} /></b>{e.matricule && <span className="mut"><Hl text={e.matricule} q={q} /></span>}</span>
              {e.inc.length > 0 && <span className="vie-n" title="Signalements de vie scolaire">{e.inc.length}</span>}
              <Icon name="chev-right" size={16} className="sgo" />
            </Link>
          </li>
        ))}
      </ol>
      <ListNav nav={list} />
    </section>
  )
}

/* ---------- page ---------- */
export default function ClasseDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { reload: reloadClasses } = useClasses()
  const { classe, loading, error, reload } = useClasse(id)
  const run = useRun(), confirm = useConfirm(), nav = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [name, setName] = useState('')
  const isAdmin = user.role === 'admin'

  useEffect(() => { if (classe) setName(classe.name) }, [classe?.name]) // eslint-disable-line
  useEffect(() => {
    if (isAdmin) usersApi.list().then(u => setTeachers(u.filter(x => x.role === 'teacher' && x.active))).catch(() => {})
  }, [isAdmin])

  const refresh = () => { reload(); reloadClasses() }
  const canManage = isAdmin || user.role === 'staff'   // l’administration enregistre les élèves

  const rename = async () => { if (name.trim() && name !== classe.name && (await run(() => classesApi.update(classe.id, { name }), 'Classe renommée'))) refresh() }
  const setPrincipal = async v => { if (await run(() => classesApi.update(classe.id, { principal: v || null }), 'Professeur principal enregistré')) refresh() }
  const removeClasse = async () => {
    if (!(await confirm({ danger: true, ok: 'Supprimer la classe', title: `Supprimer la ${classe.name} ?`, text: `Les ${classe.eleves.length} élèves et toutes les notes de cette classe seront définitivement supprimés.` }))) return
    if (await run(() => classesApi.remove(classe.id), 'Classe supprimée')) { reloadClasses(); nav('/classes', { replace: true }) }
  }

  return (
    <Async loading={loading} error={error} onRetry={reload}>
      {classe && <>
        <Link to="/classes" className="btn link back"><Icon name="chev-left" size={16} /> Classes</Link>
        <section className="card">
          <h2><Icon name="school" /> {isAdmin ? 'Classe' : classe.name}</h2>
          {isAdmin ? <>
            <div className="row mrow">
              <Field label="Nom de la classe" value={name} onChange={e => setName(e.target.value)} onBlur={rename} maxLength={30} />
              <div className="field"><label>Professeur principal</label>
                <Picker label="Professeur principal" title="Professeur principal" value={classe.principalId || ''}
                  options={[{ value: '', label: 'Aucun' }, ...teachers.map(t => ({ value: t.id, label: t.name }))]} onChange={setPrincipal} /></div>
            </div>
            <p className="mut">Le professeur principal consulte les moyennes, les bulletins et rédige les observations du conseil de classe.</p>
          </> : <p className="mut">{classe.eleves.length} élève(s) · accès {classe.access === 'full' ? 'complet' : 'à vos matières'}</p>}
        </section>

        {canManage && <Locks classe={classe} isAdmin={isAdmin} onChange={refresh} />}
        {canManage && <ImportEleves classe={classe} onDone={refresh} />}
        <div className="cols-2">
          <Matieres classe={classe} teachers={teachers} editable={isAdmin} onChange={refresh} />
          <Eleves classe={classe} canManage={canManage} />
        </div>

        {isAdmin && <button className="btn danger-o block" onClick={removeClasse}><Icon name="trash" size={16} /> Supprimer cette classe</button>}
      </>}
    </Async>
  )
}
