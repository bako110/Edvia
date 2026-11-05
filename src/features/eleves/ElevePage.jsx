import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { Async, Empty } from '../../components/ui/Common'
import { Field } from '../../components/ui/Field'
import { Sheet, Stage } from '../results/Sheets'
import MissingBanner from '../results/MissingBanner'
import { useObservations } from '../results/useObservations'
import VieSheet from '../vie/VieSheet'
import { useAuth } from '../../context/AuthContext'
import { useView } from '../../context/ViewContext'
import { useClasses } from '../../context/ClassesContext'
import { useConfirm } from '../../context/Feedback'
import { useClasse } from '../../hooks/useClasse'
import { useRun } from '../../hooks/useRun'
import { elevesApi, incidentsApi } from '../../api'
import { PERIODS, ANNUAL, TR, calc, f, rk, tone, getN, getPen, moyMat, moyMatAnnual, missingFor, vieStats } from '../../lib/calc'
import { INCIDENT_ICON, INCIDENT_LABEL, describe, shortDate, fmtHours } from '../../lib/vie'

/* ---------- Bulletin ---------- */
function BulletinTab({ classe, o, period, r, patch }) {
  const { school } = useAuth()
  const obsProps = useObservations(classe, patch)
  const miss = missingFor(o.e, classe, period)
  return <>
    <MissingBanner classe={classe} period={period} />
    <section className="card noprint">
      <div className="act" style={{ marginTop: 0 }}>
        <button className="btn p" onClick={() => window.print()}><Icon name="print" size={18} /> Imprimer ce bulletin</button>
        <span className="mut">Une feuille A4. Pour un fichier, choisissez « Enregistrer au format PDF ».</span>
      </div>
      {miss.length > 0 && <div className="alert warn"><Icon name="alert" size={18} /><span><b>Bulletin provisoire</b> : notes manquantes en {miss.map(m => m.n).join(', ')}.</span></div>}
    </section>
    <Stage><Sheet period={period} school={school} classe={classe} r={r} o={o} index={1} total={1} obsProps={obsProps} /></Stage>
  </>
}

/* ---------- Notes par matière (lecture seule ; la saisie se fait dans l'onglet Notes) ---------- */
function NotesTab({ classe, e, period }) {
  const annual = period === ANNUAL
  return (
    <section className="card">
      <h2><Icon name="edit" /> Notes · {PERIODS[period]}</h2>
      <div className="mlist">
        {classe.matieres.map((m, j) => {
          const a = annual ? null : getN(e, period, j)
          const v = annual ? moyMatAnnual(e, j) : moyMat(e, period, j)
          const pen = annual ? 0 : getPen(e, period, j)
          return (
            <div className="mrow2" key={m.id}>
              <div className="mrow2-n"><b>{m.n}</b><span className="mut">coef {m.c}{m.teacherName ? ` · ${m.teacherName}` : ''}</span></div>
              <div className="mrow2-d mut">
                {annual
                  ? TR.map((t, k) => `T${k + 1} ${f(moyMat(e, k, j))}`).join(' · ')
                  : `D1 ${a[0] || '—'} · D2 ${a[1] || '—'} · Compo ${a[2] || '—'}`}
              </div>
              <div className="mrow2-v"><span className={'chip ' + tone(v)}>{f(v)}</span>{pen > 0 && <small className="penl">−{f(pen)} pénalité</small>}</div>
            </div>
          )
        })}
      </div>
      <p className="mut">Pour modifier une note, le professeur concerné ouvre l’onglet « Notes » de l’application.</p>
    </section>
  )
}

/* ---------- Vie scolaire ---------- */
function VieTab({ classe, e, period, onAdd, onChanged }) {
  const { user } = useAuth()
  const confirm = useConfirm(), run = useRun()
  const admin = user.role === 'admin' || user.role === 'staff'
  const v = vieStats(e, period)
  const remove = async i => {
    if (!(await confirm({ danger: true, ok: 'Supprimer', title: 'Supprimer ce signalement ?', text: describe(i, classe) }))) return
    if (await run(() => incidentsApi.remove(i.id), 'Signalement supprimé')) onChanged()
  }
  return (
    <section className="card">
      <h2><Icon name="flag" /> Vie scolaire · {PERIODS[period]}</h2>
      <div className="vstats">
        <div><b>{v.retards}</b><span>Retards{v.retardMinutes ? ` · ${v.retardMinutes} min` : ''}</span></div>
        <div><b>{fmtHours(v.absenceHours)} h</b><span>Absences</span></div>
        <div><b>{v.comportements}</b><span>Comportement</span></div>
        <div><b className={v.penaltyPoints ? 'neg' : ''}>{v.penaltyPoints ? '−' + fmtHours(v.penaltyPoints) : '0'}</b><span>Pts de pénalité</span></div>
      </div>
      {period !== ANNUAL && <button className="btn p block" onClick={onAdd}><Icon name="plus" size={16} /> Ajouter un signalement</button>}
      {v.list.length === 0 && <p className="mut center">Rien à signaler sur cette période.</p>}
      <ul className="vie-list">
        {v.list.map(i => (
          <li key={i.id} className={'k-' + i.type}>
            <Icon name={INCIDENT_ICON[i.type]} size={18} />
            <div><b>{describe(i, classe)}</b><div className="mut">{INCIDENT_LABEL[i.type]} · {shortDate(i.date)} · {i.byName || 'Administration'}</div></div>
            {(admin || i.by === user.id) && <button className="btn icon-btn sm" onClick={() => remove(i)} aria-label="Supprimer"><Icon name="trash" size={16} /></button>}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- Informations (administration) ---------- */
function InfosTab({ classe, e, onChanged, onDeleted }) {
  const run = useRun(), confirm = useConfirm()
  const [d, setD] = useState({ name: e.n, matricule: e.matricule || '' })
  const dirty = d.name !== e.n || d.matricule !== (e.matricule || '')
  const save = async () => { if (await run(() => elevesApi.update(e.id, d), 'Informations enregistrées')) onChanged() }
  const remove = async () => {
    if (!(await confirm({ danger: true, ok: 'Supprimer', title: `Supprimer ${e.n} ?`, text: 'L’élève, ses notes (toutes matières) et sa vie scolaire seront définitivement supprimés.' }))) return
    if (await run(() => elevesApi.remove(e.id), 'Élève supprimé')) onDeleted()
  }
  return (
    <section className="card">
      <h2><Icon name="user" /> Informations</h2>
      <Field label="Nom et prénoms" value={d.name} onChange={ev => setD({ ...d, name: ev.target.value })} maxLength={100} />
      <Field label="Matricule" value={d.matricule} onChange={ev => setD({ ...d, matricule: ev.target.value })} maxLength={30} />
      <p className="mut">Classe : <b>{classe.name}</b></p>
      <div className="act"><button className="btn p" disabled={!dirty || !d.name.trim()} onClick={save}><Icon name="check" size={16} /> Enregistrer</button></div>
      <hr className="sep" />
      <button className="btn danger-o block" onClick={remove}><Icon name="trash" size={16} /> Supprimer cet élève</button>
    </section>
  )
}

/* ---------- Fiche élève ---------- */
export default function ElevePage() {
  const { cid, eid } = useParams()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const { period, trim } = useView()
  const { reload: reloadClasses } = useClasses()
  const { classe, loading, error, reload, refresh, patch } = useClasse(cid)
  const [vieOpen, setVieOpen] = useState(false)

  return (
    <Async loading={loading} error={error} onRetry={reload}>
      {classe && (() => {
        const i = classe.eleves.findIndex(x => x.id === eid), e = classe.eleves[i]
        if (!e) return <Empty icon="user" title="Élève introuvable" text="Cet élève n’existe plus ou ne fait pas partie de cette classe."><Link to={`/classes/${cid}`} className="btn p">Retour à la classe</Link></Empty>
        const full = classe.access === 'full', admin = user.role === 'admin' || user.role === 'staff'
        const tabs = [...(full ? [['bulletin', 'Bulletin', 'file']] : []), ['notes', 'Notes', 'edit'], ['vie', 'Vie scolaire', 'flag'], ...(admin ? [['infos', 'Infos', 'user']] : [])]
        const tab = tabs.some(t => t[0] === params.get('tab')) ? params.get('tab') : tabs[0][0]
        const r = calc(classe, period), o = r.list.find(x => x.e.id === eid)
        const go = id => `/classes/${cid}/eleves/${id}?tab=${tab}`
        const prev = classe.eleves[i - 1], next = classe.eleves[i + 1]
        return <>
          <Link to={`/classes/${cid}`} className="btn link back noprint"><Icon name="chev-left" size={16} /> {classe.name}</Link>
          <section className="card noprint ehead">
            <span className="avatar xl">{e.n[0]}</span>
            <div className="ehead-t">
              <h2>{e.n}</h2>
              <div className="mut">{classe.name}{e.matricule ? ` · ${e.matricule}` : ''} · {i + 1} / {classe.eleves.length}</div>
              {full && o && <div className="ehead-s"><span className={'chip ' + tone(o.moy)}>{f(o.moy)} / 20</span>{o.rang && <span className="tag">{rk(o.rang)} sur {r.tot}</span>}</div>}
            </div>
            <div className="ehead-n">
              <button className="btn icon-btn sm" disabled={!prev} onClick={() => nav(go(prev.id), { replace: true })} aria-label="Élève précédent"><Icon name="chev-left" /></button>
              <button className="btn icon-btn sm" disabled={!next} onClick={() => nav(go(next.id), { replace: true })} aria-label="Élève suivant"><Icon name="chev-right" /></button>
            </div>
          </section>

          <div className="seg noprint etabs" role="tablist">
            {tabs.map(([k, l, ic]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setParams({ tab: k }, { replace: true })}><Icon name={ic} size={16} />{l}</button>)}
          </div>

          {tab === 'bulletin' && o && <BulletinTab classe={classe} o={o} period={period} r={r} patch={patch} />}
          {tab === 'notes' && <NotesTab classe={classe} e={e} period={period} />}
          {tab === 'vie' && <VieTab classe={classe} e={e} period={period} onAdd={() => setVieOpen(true)} onChanged={refresh} />}
          {tab === 'infos' && <InfosTab key={e.id} classe={classe} e={e} onChanged={() => { refresh(); reloadClasses() }} onDeleted={() => { reloadClasses(); nav(`/classes/${cid}`, { replace: true }) }} />}
          {vieOpen && <VieSheet eleve={e} classe={classe} tr={trim} onClose={() => setVieOpen(false)} onChanged={refresh} />}
        </>
      })()}
    </Async>
  )
}
