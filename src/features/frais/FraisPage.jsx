import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Bar, Empty } from '../../components/ui/Common'
import { Field } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useConfirm, useToast } from '../../context/Feedback'
import { useAsync } from '../../hooks/useAsync'
import { useRun } from '../../hooks/useRun'
import { usePaged } from '../../hooks/usePaged'
import { financeApi } from '../../api'
import { METHODS, MODALITES, STATE, TRANCHE_STATE, buildTranches, dateFr, fcfa, int, methodLabel, pct } from '../../lib/money'
import { smartFilter } from '../../lib/search'
import { SearchBox, ListNav } from '../../components/ui/ListTools'
import { ClassPick, useClassChoice } from '../gestion/shared'
import Contact from '../gestion/Contact'

const today = () => new Date().toISOString().slice(0, 10)

/* ---------- vue d'ensemble de l'établissement ---------- */
function Overview({ data, onPick, current }) {
  const t = data.total
  return <>
    <div className="kpis k3">
      <div className="kpi"><Icon name="wallet" /><b>{fcfa(t.due)}</b><span>À encaisser</span></div>
      <div className="kpi"><Icon name="checkc" /><b>{fcfa(t.paid)}</b><span>Encaissé · {pct(t.paid, t.due)} %</span></div>
      <div className="kpi"><Icon name="alert" /><b>{fcfa(t.balance)}</b><span>Reste · {t.nbRetard} élève{t.nbRetard > 1 ? 's' : ''} en retard</span></div>
    </div>
    <section className="card">
      <h2><Icon name="school" /> Recouvrement par classe</h2>
      {data.classes.map(c => (
        <button className={'cprog btnrow' + (c.id === current ? ' on' : '')} key={c.id} onClick={() => onPick(c.id)}>
          <div className="cprog-h"><b>{c.name}</b>
            <span className="mut">{c.hasPlan ? `${fcfa(c.paid)} sur ${fcfa(c.due)}${c.nbRetard ? ` · ${c.nbRetard} en retard` : ''}` : 'frais à définir'}</span></div>
          {c.hasPlan ? <Bar pct={pct(c.paid, c.due)} tone={c.nbRetard ? 'bad' : ''} /> : <span className="tag gold">Frais non définis</span>}
        </button>
      ))}
    </section>
  </>
}

/* ---------- plan de frais d'une classe : montants et modalité de paiement ---------- */
function PlanEditor({ classe, plan, editable, onSaved }) {
  const { school } = useAuth()
  const run = useRun()
  const init = plan || { capacity: 0, inscription: 0, scolarite: 0, modalite: 'trimestriel', tranches: [] }
  const [f, setF] = useState({ capacity: String(init.capacity || ''), inscription: String(init.inscription || ''), scolarite: String(init.scolarite || ''), modalite: init.modalite })
  const [tranches, setTranches] = useState(init.tranches.map(t => ({ ...t, amount: String(t.amount) })))
  const [open, setOpen] = useState(!plan)

  const regen = (modalite, scolarite) => {
    if (modalite === 'personnalise') return
    setTranches(buildTranches(modalite, int(scolarite), school.annee).map(t => ({ ...t, amount: String(t.amount) })))
  }
  const setModalite = m => { setF(s => ({ ...s, modalite: m })); regen(m, f.scolarite) }
  const setScolarite = v => { setF(s => ({ ...s, scolarite: v })); regen(f.modalite, v) }
  const setTr = (i, k, v) => setTranches(l => l.map((t, j) => (j === i ? { ...t, [k]: v } : t)))
  const addTr = () => setTranches(l => [...l, { label: `Échéance ${l.length + 1}`, amount: '', due: today() }])

  const total = tranches.reduce((s, t) => s + int(t.amount), 0), sco = int(f.scolarite)
  const ok = sco === 0 || (tranches.length > 0 && total === sco)
  const save = async () => {
    const body = { capacity: int(f.capacity), inscription: int(f.inscription), scolarite: sco, modalite: f.modalite, tranches: sco ? tranches.map(t => ({ ...t, amount: int(t.amount) })) : [] }
    if (await run(() => financeApi.setPlan(classe.id, body), 'Frais enregistrés')) { setOpen(false); onSaved() }
  }

  return (
    <section className="card">
      <button className="fold" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <h2><Icon name="settings" /> Frais et modalités · {classe.name}</h2><Icon name={open ? 'chev-down' : 'chev-right'} size={18} />
      </button>
      {!open && plan && (
        <div className="plan-sum">
          <div><span className="mut">Inscription</span><b>{fcfa(plan.inscription)}</b></div>
          <div><span className="mut">Scolarité</span><b>{fcfa(plan.scolarite)}</b></div>
          <div><span className="mut">Modalité</span><b>{MODALITES.find(m => m.value === plan.modalite)?.label}</b></div>
          {plan.capacity > 0 && <div><span className="mut">Effectif max.</span><b>{plan.capacity}</b></div>}
        </div>
      )}
      {open && !editable && <p className="mut">Seul l’administrateur définit les frais.</p>}
      {open && editable && <>
        <div className="row mrow">
          <Field label="Droit d’inscription (FCFA)" value={f.inscription} onChange={e => setF(s => ({ ...s, inscription: e.target.value }))} inputMode="numeric" placeholder="0" />
          <Field label="Scolarité annuelle (FCFA)" value={f.scolarite} onChange={e => setScolarite(e.target.value)} inputMode="numeric" placeholder="0" />
        </div>
        <div className="row mrow">
          <div className="field"><label>Modalité de paiement</label>
            <Picker label="Modalité" title="Modalité de paiement de la scolarité" value={f.modalite} options={MODALITES} onChange={setModalite} /></div>
          <Field label="Effectif maximum" hint="0 = illimité" value={f.capacity} onChange={e => setF(s => ({ ...s, capacity: e.target.value }))} inputMode="numeric" placeholder="0" />
        </div>

        {sco > 0 && <>
          <h3 className="sub">Échéancier</h3>
          {tranches.map((t, i) => (
            <div className="tr-row" key={i}>
              <input value={t.label} onChange={e => setTr(i, 'label', e.target.value)} aria-label="Nom de l’échéance" maxLength={40} />
              <input value={t.amount} onChange={e => setTr(i, 'amount', e.target.value)} inputMode="numeric" aria-label="Montant" />
              <input type="date" value={t.due} onChange={e => setTr(i, 'due', e.target.value)} aria-label="Date limite" />
              <button className="btn icon-btn sm" onClick={() => setTranches(l => l.filter((_, j) => j !== i))} aria-label="Retirer l’échéance"><Icon name="close" size={16} /></button>
            </div>
          ))}
          <div className="act">
            <button className="btn sm" onClick={addTr} disabled={tranches.length >= 12}><Icon name="plus" size={16} /> Ajouter une échéance</button>
            {f.modalite !== 'personnalise' && <button className="btn sm" onClick={() => regen(f.modalite, f.scolarite)}>Recalculer</button>}
          </div>
          <div className={'alert ' + (ok ? 'ok' : 'warn')}>
            <Icon name={ok ? 'checkc' : 'alert'} size={18} />
            {ok ? `Total des échéances : ${fcfa(total)}` : `Total des échéances : ${fcfa(total)} — il doit être égal à la scolarité (${fcfa(sco)}), écart ${fcfa(sco - total)}.`}
          </div>
        </>}
        <div className="act"><button className="btn p" disabled={!ok} onClick={save}><Icon name="check" size={16} /> Enregistrer les frais</button></div>
      </>}
    </section>
  )
}

/* ---------- encaissement ---------- */
function PayForm({ eleve, onDone }) {
  const run = useRun()
  const inscLeft = eleve.inscription.due - eleve.inscription.paid
  const scoLeft = (eleve.due - eleve.inscription.due) - (eleve.paid - eleve.inscription.paid)
  const kinds = [...(inscLeft > 0 ? [{ value: 'inscription', label: 'Droit d’inscription', sub: `reste ${fcfa(inscLeft)}` }] : []), ...(scoLeft > 0 ? [{ value: 'scolarite', label: 'Scolarité', sub: `reste ${fcfa(scoLeft)}` }] : [])]
  const nextTr = eleve.tranches.find(t => t.state !== 'paye')
  const [kind, setKind] = useState(kinds[0]?.value)
  const left = kind === 'inscription' ? inscLeft : scoLeft
  const suggestion = kind === 'scolarite' && nextTr ? Math.max(1, nextTr.amount - nextTr.paid) : left
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('especes')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(today())
  if (!kinds.length) return <div className="alert ok"><Icon name="checkc" size={18} />Tout est réglé pour cet élève.</div>

  const submit = async () => {
    if (await run(() => financeApi.pay(eleve.id, { kind, amount: int(amount || suggestion), method, reference, date }), 'Versement enregistré')) { setAmount(''); setReference(''); onDone() }
  }
  return (
    <div className="payform">
      <h4 className="vie-h">Encaisser un versement</h4>
      <div className="row mrow">
        <div className="field"><label>Pour</label><Picker label="Pour" value={kind} options={kinds} onChange={v => { setKind(v); setAmount('') }} /></div>
        <Field label="Montant (FCFA)" value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" placeholder={String(suggestion)} />
      </div>
      <div className="chips">
        {nextTr && kind === 'scolarite' && <button type="button" className="chipbtn" onClick={() => setAmount(String(suggestion))}>{nextTr.label} : {fcfa(suggestion)}</button>}
        <button type="button" className="chipbtn" onClick={() => setAmount(String(left))}>Solde : {fcfa(left)}</button>
      </div>
      <div className="row mrow">
        <div className="field"><label>Moyen</label><Picker label="Moyen" value={method} options={METHODS} onChange={setMethod} /></div>
        <Field label="Date" type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} />
      </div>
      {method !== 'especes' && <Field label={method === 'cheque' ? 'N° du chèque' : 'Référence de la transaction'} value={reference} onChange={e => setReference(e.target.value)} maxLength={60} />}
      <button className="btn p block" disabled={int(amount || suggestion) < 1} onClick={submit}><Icon name="check" size={16} /> Enregistrer {fcfa(int(amount || suggestion))}</button>
    </div>
  )
}

function Receipt({ p, eleve, classe, school }) {
  const toast = useToast()
  const copy = async () => {
    const text = `${school}\nReçu n° ${p.receipt}\nÉlève : ${eleve.name} (${classe})\n${p.kind === 'inscription' ? 'Droit d’inscription' : 'Scolarité'} : ${fcfa(p.amount)}\nPayé le ${dateFr(p.date)} · ${methodLabel(p.method)}${p.reference ? ' (' + p.reference + ')' : ''}\nReste à payer : ${fcfa(eleve.balance)}`
    try { await navigator.clipboard.writeText(text); toast('Reçu copié') } catch { toast('Copie impossible', 'err') }
  }
  return <button className="btn icon-btn sm" onClick={copy} aria-label="Copier le reçu" title="Copier le reçu"><Icon name="copy" size={16} /></button>
}

function EleveFinance({ eleve, classe, isAdmin, onChange }) {
  const { school } = useAuth()
  const run = useRun(), confirm = useConfirm()
  const cancel = async p => {
    if (!(await confirm({ danger: true, ok: 'Annuler le versement', title: `Annuler le reçu ${p.receipt} ?`, text: `${fcfa(p.amount)} seront retirés des paiements de ${eleve.name}.` }))) return
    if (await run(() => financeApi.cancel(p.id), 'Versement annulé')) onChange()
  }
  return (
    <div className="fin-detail">
      {eleve.tranches.length > 0 && <>
        <h4 className="vie-h">Échéancier</h4>
        {eleve.tranches.map((t, i) => (
          <div className="tr-line" key={i}>
            <span><b>{t.label}</b> <span className="mut">avant le {dateFr(t.due)}</span></span>
            <span>{fcfa(t.paid)} / {fcfa(t.amount)}</span>
            <span className={'tag ' + TRANCHE_STATE[t.state].cls}>{TRANCHE_STATE[t.state].label}</span>
          </div>
        ))}
      </>}
      {eleve.remise > 0 && <p className="mut">Remise accordée : {fcfa(eleve.remise)}</p>}
      <div className="act"><span className="mut">{eleve.parentName || 'Parent'} · {eleve.parentPhone || 'pas de numéro'}</span>
        <Contact phone={eleve.parentPhone} text={`Bonjour, ici l’établissement au sujet de ${eleve.name} : solde de scolarité de ${fcfa(eleve.balance)}.`} /></div>
      <PayForm eleve={eleve} onDone={onChange} />
      <h4 className="vie-h">Versements reçus</h4>
      {eleve.paiements.length === 0 && <p className="mut">Aucun versement pour le moment.</p>}
      <ul className="vie-list">
        {eleve.paiements.map(p => (
          <li key={p.id}>
            <Icon name="wallet" size={18} />
            <div><b>{fcfa(p.amount)}</b> · {p.kind === 'inscription' ? 'Inscription' : 'Scolarité'}
              <div className="mut">{dateFr(p.date)} · {methodLabel(p.method)}{p.reference ? ` · ${p.reference}` : ''} · reçu {p.receipt} · {p.byName}</div></div>
            <Receipt p={p} eleve={eleve} classe={classe.name} school={school.name} />
            {isAdmin && <button className="btn icon-btn sm" onClick={() => cancel(p)} aria-label="Annuler le versement"><Icon name="trash" size={16} /></button>}
          </li>
        ))}
      </ul>
    </div>
  )
}

const FILTERS = [['all', 'Tous'], ['en_retard', 'En retard'], ['en_cours', 'En cours'], ['solde', 'Soldés']]

function ClassFinance({ data, isAdmin, onChange }) {
  const nav = useNavigate()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const rows = useMemo(() => data.eleves.filter(e => filter === 'all' || e.state === filter), [data, filter])
  const found = smartFilter(rows, q, e => `${e.name} ${e.matricule} ${e.parentName}`)
  const list = usePaged(found.items, { size: 15, resetKey: q + filter + data.classe.id })
  const t = data.totals

  return (
    <section className="card">
      <h2><Icon name="users" /> Élèves · {data.classe.name} <span className="count">{data.eleves.length}</span></h2>
      {data.plan && <div className="plan-sum">
        <div><span className="mut">À encaisser</span><b>{fcfa(t.due)}</b></div>
        <div><span className="mut">Encaissé</span><b>{fcfa(t.paid)}</b></div>
        <div><span className="mut">Reste</span><b className={t.balance ? 'lw' : ''}>{fcfa(t.balance)}</b></div>
      </div>}
      {t.nbRetard > 0 && (
        <div className="alert warn"><Icon name="bell" size={18} /><div>{t.nbRetard} élève{t.nbRetard > 1 ? 's' : ''} en retard de paiement ({fcfa(t.retard)}).
          {' '}<button className="btn link" onClick={() => nav('/parents', { state: { audience: 'impayes', classeId: data.classe.id } })}>Relancer les parents <Icon name="arrow" size={14} /></button></div></div>
      )}
      <div className="chips fchips">
        {FILTERS.map(([k, l]) => <button key={k} className={'chipbtn' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {data.eleves.length > 8 && <SearchBox value={q} onChange={setQ} count={found.items.length} total={rows.length} fuzzy={found.fuzzy} />}
      {!data.plan && <p className="mut">Définissez les frais de la classe pour suivre les paiements.</p>}
      {data.plan && found.items.length === 0 && <p className="mut center">Aucun élève dans cette catégorie.</p>}
      <div className="finlist">
        {data.plan && list.shown.map(e => (
          <div className={'finrow' + (open === e.id ? ' open' : '')} key={e.id}>
            <button className="finhead" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}>
              <span className="sname"><b>{e.name}</b><span className="mut">{fcfa(e.paid)} sur {fcfa(e.due)}</span></span>
              <span className="finr"><span className={'tag ' + STATE[e.state].cls}>{STATE[e.state].label}</span>{e.balance > 0 && <span className="mut">reste {fcfa(e.balance)}</span>}</span>
              <Icon name={open === e.id ? 'chev-down' : 'chev-right'} size={16} />
            </button>
            {e.due > 0 && <Bar pct={pct(e.paid, e.due)} tone={e.state === 'en_retard' ? 'bad' : ''} />}
            {open === e.id && <EleveFinance eleve={e} classe={data.classe} isAdmin={isAdmin} onChange={onChange} />}
          </div>
        ))}
      </div>
      <ListNav nav={list} />
    </section>
  )
}

export default function FraisPage() {
  const { user } = useAuth()
  const { classes } = useClasses()
  const [classeId, setClasseId] = useClassChoice(classes)
  const [version, setVersion] = useState(0)
  const bump = () => setVersion(v => v + 1)
  const overview = useAsync(financeApi.overview, [version])
  const detail = useAsync(() => (classeId ? financeApi.classe(classeId) : Promise.resolve(null)), [classeId, version])
  const isAdmin = user.role === 'admin'

  if (!classes.length) return <Empty icon="school" title="Aucune classe" text="Créez d’abord les classes de l’établissement." />
  return <>
    <Async loading={overview.loading && !overview.data} error={overview.error} onRetry={overview.reload}>
      {overview.data && <Overview data={overview.data} current={classeId} onPick={setClasseId} />}
    </Async>
    <section className="card"><ClassPick classes={classes} value={classeId} onChange={setClasseId} label="Classe à gérer" /></section>
    <Async loading={detail.loading && !detail.data} error={detail.error} onRetry={detail.reload}>
      {detail.data && <>
        <PlanEditor key={classeId + ':' + (detail.data.plan ? 'p' : 'n') + version} classe={detail.data.classe} plan={detail.data.plan} editable={isAdmin} onSaved={bump} />
        <ClassFinance data={detail.data} isAdmin={isAdmin} onChange={bump} />
      </>}
    </Async>
  </>
}
