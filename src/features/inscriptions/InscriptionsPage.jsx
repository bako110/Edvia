import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Bar, Empty } from '../../components/ui/Common'
import { Field } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useAsync } from '../../hooks/useAsync'
import { useClasse } from '../../hooks/useClasse'
import { useRun } from '../../hooks/useRun'
import { usePaged } from '../../hooks/usePaged'
import { elevesApi, inscriptionsApi } from '../../api'
import { ENROLL, METHODS, int } from '../../lib/money'
import { smartFilter } from '../../lib/search'
import { SearchBox, ListNav } from '../../components/ui/ListTools'
import { ClassPick, Sheet, useClassChoice } from '../gestion/shared'
import Contact, { validPhone } from '../gestion/Contact'

const STATUS_OPTIONS = Object.entries(ENROLL).map(([value, s]) => ({ value, label: s.label }))
const EMPTY = { name: '', matricule: '', parentName: '', parentPhone: '', parentEmail: '', status: 'enrolled', remise: '', paid: '', method: 'especes' }

/* ---------- inscription d'un élève ---------- */
function Enroll({ classes, classeId, setClasseId, onDone }) {
  const run = useRun()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(EMPTY)
  const set = k => e => setF(s => ({ ...s, [k]: e.target ? e.target.value : e }))

  const submit = async () => {
    const body = { name: f.name, matricule: f.matricule, status: f.status, parentName: f.parentName, parentPhone: f.parentPhone, parentEmail: f.parentEmail, remise: int(f.remise) }
    if (int(f.paid) > 0) body.paiement = { amount: int(f.paid), method: f.method }
    if (await run(() => inscriptionsApi.enroll(classeId, body), `${f.name.trim()} inscrit(e)`)) { setF(EMPTY); onDone() }
  }
  return (
    <section className="card">
      <button className="fold" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <h2><Icon name="plus" /> Inscrire un élève</h2><Icon name={open ? 'chev-down' : 'chev-right'} size={18} />
      </button>
      {open && <>
        <ClassPick classes={classes} value={classeId} onChange={setClasseId} />
        <div className="row mrow">
          <Field label="Nom et prénom" value={f.name} onChange={set('name')} placeholder="NOM Prénom" maxLength={100} />
          <Field label="Matricule" value={f.matricule} onChange={set('matricule')} placeholder="facultatif" maxLength={30} />
        </div>
        <h3 className="sub">Parent / tuteur</h3>
        <div className="row mrow">
          <Field label="Nom" value={f.parentName} onChange={set('parentName')} maxLength={100} />
          <Field label="Numéro à contacter *" value={f.parentPhone} onChange={set('parentPhone')} inputMode="tel" placeholder="70 00 00 00" maxLength={25}
            hint="Obligatoire : c’est ce numéro qu’on appellera en cas de besoin." />
        </div>
        <Field label="E-mail (facultatif)" value={f.parentEmail} onChange={set('parentEmail')} inputMode="email" autoCapitalize="none" maxLength={120} />
        <h3 className="sub">Dossier</h3>
        <div className="row mrow">
          <div className="field"><label>Statut</label><Picker label="Statut" value={f.status} options={STATUS_OPTIONS.filter(o => o.value !== 'withdrawn')} onChange={set('status')} /></div>
          <Field label="Remise / bourse (FCFA)" value={f.remise} onChange={set('remise')} inputMode="numeric" placeholder="0" />
        </div>
        <div className="row mrow">
          <Field label="Droit d’inscription déjà versé (FCFA)" value={f.paid} onChange={set('paid')} inputMode="numeric" placeholder="0" />
          <div className="field"><label>Moyen de paiement</label><Picker label="Moyen" value={f.method} options={METHODS} onChange={set('method')} /></div>
        </div>
        <div className="act"><button className="btn p" disabled={!f.name.trim() || !classeId || !validPhone(f.parentPhone)} onClick={submit}><Icon name="check" size={16} /> Enregistrer l’inscription</button></div>
      </>}
    </section>
  )
}

/* ---------- modification d'un dossier ---------- */
function EditSheet({ eleve, onClose, onSaved }) {
  const run = useRun()
  const [f, setF] = useState({ status: eleve.status, parentName: eleve.parentName, parentPhone: eleve.parentPhone, parentEmail: eleve.parentEmail, remise: String(eleve.remise || '') })
  const set = k => e => setF(s => ({ ...s, [k]: e.target ? e.target.value : e }))
  const save = async () => {
    if (await run(() => elevesApi.update(eleve.id, { ...f, remise: int(f.remise) }), 'Dossier enregistré')) { onSaved(); onClose() }
  }
  return (
    <Sheet title={eleve.n} sub="Dossier d’inscription" onClose={onClose}>
      <div className="vie-form">
        <div className="field"><label>Statut</label><Picker label="Statut" value={f.status} options={STATUS_OPTIONS} onChange={set('status')} /></div>
        <div className="row mrow">
          <Field label="Parent / tuteur" value={f.parentName} onChange={set('parentName')} maxLength={100} />
          <Field label="Numéro à contacter *" value={f.parentPhone} onChange={set('parentPhone')} inputMode="tel" maxLength={25} />
        </div>
        <Field label="E-mail" value={f.parentEmail} onChange={set('parentEmail')} inputMode="email" autoCapitalize="none" maxLength={120} />
        <Field label="Remise / bourse sur la scolarité (FCFA)" value={f.remise} onChange={set('remise')} inputMode="numeric" />
        <div className="act"><Contact phone={f.parentPhone} text={`Bonjour, ici l’établissement au sujet de ${eleve.n}.`} /></div>
        <button className="btn p block" disabled={!validPhone(f.parentPhone)} onClick={save}><Icon name="check" size={16} /> Enregistrer</button>
      </div>
    </Sheet>
  )
}

function Students({ classeId }) {
  const { classe, loading, error, reload } = useClasse(classeId)
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const found = smartFilter((classe?.eleves || []).map((e, i) => ({ e, i })), q, ({ e }) => `${e.n} ${e.matricule || ''} ${e.parentName || ''}`)
  const list = usePaged(found.items, { size: 20, resetKey: q + classeId })
  return (
    <Async loading={loading} error={error} onRetry={reload}>
      {classe && (
        <section className="card">
          <h2><Icon name="users" /> Élèves · {classe.name} <span className="count">{classe.eleves.length}</span></h2>
          {classe.eleves.length > 8 && <SearchBox value={q} onChange={setQ} count={found.items.length} total={classe.eleves.length} fuzzy={found.fuzzy} />}
          {classe.eleves.length === 0 && <p className="mut center">Aucun élève dans cette classe.</p>}
          <ol className="slist">
            {list.shown.map(({ e, i }) => (
              <li key={e.id}>
                <div className="srow">
                  <button className="btnrow srow-main" onClick={() => setEdit(e)}>
                    <span className="nidx">{i + 1}</span>
                    <span className="sname"><b>{e.n}</b><span className="mut">{e.parentName ? `${e.parentName}${e.parentPhone ? ' · ' + e.parentPhone : ''}` : e.parentPhone || 'Aucun numéro à contacter'}</span></span>
                    <span className={'tag ' + ENROLL[e.status].cls}>{ENROLL[e.status].label}</span>
                  </button>
                  <Contact phone={e.parentPhone} text={`Bonjour, ici l’établissement au sujet de ${e.n}.`} />
                </div>
              </li>
            ))}
          </ol>
          <ListNav nav={list} />
          {edit && <EditSheet eleve={edit} onClose={() => setEdit(null)} onSaved={reload} />}
        </section>
      )}
    </Async>
  )
}

export default function InscriptionsPage() {
  const { user } = useAuth()
  const { classes, reload: reloadClasses } = useClasses()
  const [classeId, setClasseId] = useClassChoice(classes)
  const [version, setVersion] = useState(0)
  const { data, loading, error, reload } = useAsync(inscriptionsApi.overview, [version])
  const refresh = () => { setVersion(v => v + 1); reloadClasses() }

  if (!classes.length) return <Empty icon="school" title="Aucune classe" text="Créez d’abord les classes de l’établissement." />
  const t = data?.total
  return <>
    <Async loading={loading} error={error} onRetry={reload}>
      {data && <>
        <div className="kpis k3">
          <div className="kpi"><Icon name="checkc" /><b>{t.enrolled}</b><span>Inscrits</span></div>
          <div className="kpi"><Icon name="clock" /><b>{t.pending}</b><span>Dossiers en attente</span></div>
          <div className="kpi"><Icon name="logout" /><b>{t.withdrawn}</b><span>Retirés</span></div>
        </div>
        <section className="card">
          <h2><Icon name="school" /> Effectifs par classe</h2>
          {data.classes.map(c => (
            <button className={'cprog btnrow' + (c.id === classeId ? ' on' : '')} key={c.id} onClick={() => setClasseId(c.id)}>
              <div className="cprog-h"><b>{c.name}</b>
                <span className="mut">{c.enrolled} inscrit{c.enrolled > 1 ? 's' : ''}{c.pending ? ` · ${c.pending} en attente` : ''}{c.capacity ? ` · ${c.free} place${c.free > 1 ? 's' : ''} libre${c.free > 1 ? 's' : ''} sur ${c.capacity}` : ''}</span></div>
              {c.capacity > 0 && <Bar pct={(c.enrolled + c.pending) / c.capacity * 100} tone={c.free === 0 ? 'bad' : ''} />}
            </button>
          ))}
          {user.role === 'admin' && <p className="mut">L’effectif maximum de chaque classe se règle dans <b>Frais de scolarité</b>.</p>}
        </section>
      </>}
    </Async>
    <Enroll classes={classes} classeId={classeId} setClasseId={setClasseId} onDone={refresh} />
    <Students key={classeId + ':' + version} classeId={classeId} />
  </>
}
