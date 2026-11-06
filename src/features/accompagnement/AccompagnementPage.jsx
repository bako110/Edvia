import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Bar, Empty } from '../../components/ui/Common'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useClasse } from '../../hooks/useClasse'
import { usePaged } from '../../hooks/usePaged'
import { TR, f, rk } from '../../lib/calc'
import { LEVELS, analyseClasse, currentPeriod, parentDraft } from '../../lib/coach'
import { ClassPick, useClassChoice } from '../gestion/shared'
import { ListNav } from '../../components/ui/ListTools'

const FILTERS = [['priorite', 'Priorités'], ['suivre', 'À suivre'], ['all', 'Tous']]

function Student({ item, classe, tr, office, open, onToggle }) {
  const { e, a } = item
  const nav = useNavigate()
  const lv = LEVELS[a.level]
  return (
    <div className={'finrow coach' + (open ? ' open' : '')}>
      <button className="finhead" onClick={onToggle} aria-expanded={open}>
        <span className="sname"><b>{e.n}</b>
          <span className="mut">Moyenne {f(a.moy)}/20{a.rang ? ` · ${rk(a.rang)}` : ''}{a.trend !== null ? ` · ${a.trend >= 0 ? '+' : ''}${f(a.trend)} pt` : ''}</span></span>
        <span className={'tag ' + lv.cls}>{lv.label}</span>
        <Icon name={open ? 'chev-down' : 'chev-right'} size={16} />
      </button>
      {open && (
        <div className="fin-detail">
          {a.moys.some(x => x !== null) && (
            <div className="trend">
              {a.moys.map((m, i) => <div key={i}><span className="mut">T{i + 1}</span><b>{f(m)}</b></div>)}
            </div>
          )}
          {a.flags.length > 0 && <>
            <h4 className="vie-h">Pourquoi cette alerte</h4>
            <ul className="why">{a.flags.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </>}
          {(a.weak.length > 0 || a.strong.length > 0) && (
            <div className="subj-cols">
              {a.weak.length > 0 && <div><h4 className="vie-h">À renforcer</h4>{a.weak.map(s => <div className="tr-line" key={s.n}><span>{s.n}</span><b className="lw">{f(s.moy)}</b></div>)}</div>}
              {a.strong.length > 0 && <div><h4 className="vie-h">Points forts</h4>{a.strong.map(s => <div className="tr-line" key={s.n}><span>{s.n}</span><b>{f(s.moy)}</b></div>)}</div>}
            </div>
          )}
          <h4 className="vie-h">Pistes d’accompagnement</h4>
          <ul className="why ok">{a.advice.map((t, i) => <li key={i}>{t}</li>)}</ul>
          <div className="act">
            <Link className="btn sm" to={`/classes/${classe.id}/eleves/${e.id}`}><Icon name="file" size={14} /> Fiche élève</Link>
            {office && <button className="btn sm p" onClick={() => nav('/parents', { state: { audience: 'eleve', classeId: classe.id, eleveId: e.id, body: parentDraft(a, tr) } })}><Icon name="chat" size={14} /> Écrire au parent</button>}
          </div>
        </div>
      )}
    </div>
  )
}

function Analysis({ classe, tr, office }) {
  const [filter, setFilter] = useState('priorite')
  const [open, setOpen] = useState(null)
  const res = useMemo(() => analyseClasse(classe, tr), [classe, tr])
  const items = res.eleves.filter(x => filter === 'all' || (filter === 'priorite' ? x.a.level === 'haut' : x.a.level === 'moyen'))
  const list = usePaged(items, { size: 15, resetKey: filter + classe.id + tr })
  const mean = res.ranking.cm

  return <>
    <div className="kpis k3">
      <div className="kpi"><Icon name="alert" /><b>{res.counts.haut}</b><span>Élèves prioritaires</span></div>
      <div className="kpi"><Icon name="flag" /><b>{res.counts.moyen}</b><span>À suivre</span></div>
      <div className="kpi"><Icon name="chart" /><b>{f(mean)}</b><span>Moyenne de la classe</span></div>
    </div>

    {res.subjects.length > 0 && (
      <section className="card">
        <h2><Icon name="book" /> Matières les plus fragiles</h2>
        {res.subjects.slice(0, 4).map(s => (
          <div className="cprog" key={s.n}>
            <div className="cprog-h"><b>{s.n}</b><span className="mut">moyenne {f(s.moy)} · {s.below}/{s.total} sous 10{s.teacher ? ` · ${s.teacher}` : ''}</span></div>
            <Bar pct={s.below / s.total * 100} tone={s.below / s.total >= 0.5 ? 'bad' : ''} />
          </div>
        ))}
      </section>
    )}

    <section className="card">
      <h2><Icon name="spark" /> Élèves à accompagner · {TR[tr]}</h2>
      <div className="chips fchips">
        {FILTERS.map(([k, l]) => <button key={k} className={'chipbtn' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {items.length === 0 && <div className="allgood"><Icon name="checkc" size={26} /><div><b>Aucun élève dans cette catégorie</b><div className="mut">{filter === 'priorite' ? 'Personne ne présente de signal de difficulté marqué.' : 'Rien à signaler.'}</div></div></div>}
      <div className="finlist">
        {list.shown.map(it => <Student key={it.e.id} item={it} classe={classe} tr={tr} office={office} open={open === it.e.id} onToggle={() => setOpen(open === it.e.id ? null : it.e.id)} />)}
      </div>
      <ListNav nav={list} />
    </section>
  </>
}

export default function AccompagnementPage() {
  const { user } = useAuth()
  const { fullAccess } = useClasses()
  const [classeId, setClasseId] = useClassChoice(fullAccess)
  const [trChoice, setTr] = useState(null)
  const { classe, loading, error, reload } = useClasse(classeId)
  const office = user.role === 'admin' || user.role === 'staff'

  if (!fullAccess.length) return <Empty icon="spark" title="Accès limité" text="L’accompagnement des élèves est réservé à l’administration et aux professeurs principaux, qui voient toutes les matières de la classe." />
  const auto = classe ? currentPeriod(classe) : null
  const tr = trChoice ?? auto

  return <>
    <section className="card">
      <h2><Icon name="spark" /> Assistant pédagogique</h2>
      <p className="mut">Il repère les élèves en difficulté à partir des moyennes, de leur évolution, des matières faibles, des absences et du comportement, puis propose des pistes d’accompagnement. Chaque alerte indique la raison qui la déclenche.</p>
      <div className="row mrow">
        <ClassPick classes={fullAccess} value={classeId} onChange={id => { setClasseId(id); setTr(null) }} />
        <div className="field"><label>Trimestre</label>
          <Picker label="Trimestre" value={tr ?? 0} options={TR.map((t, i) => ({ value: i, label: t }))} onChange={setTr} /></div>
      </div>
    </section>
    <Async loading={loading} error={error} onRetry={reload}>
      {classe && (tr === null || classe.eleves.length === 0
        ? <Empty icon="chart" title="Pas encore d’analyse possible" text={classe.eleves.length === 0 ? 'Cette classe n’a pas encore d’élèves.' : 'Aucune note n’a encore été saisie dans cette classe.'} />
        : <Analysis classe={classe} tr={tr} office={office} />)}
    </Async>
  </>
}
