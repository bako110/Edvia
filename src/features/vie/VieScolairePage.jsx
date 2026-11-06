import { useMemo, useState } from 'react'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Empty } from '../../components/ui/Common'
import { useClasses } from '../../context/ClassesContext'
import { useView } from '../../context/ViewContext'
import { useClasse } from '../../hooks/useClasse'
import { useRun } from '../../hooks/useRun'
import { usePaged } from '../../hooks/usePaged'
import { incidentsApi } from '../../api'
import { ANNUAL, PERIODS, vieStats } from '../../lib/calc'
import { fmtHours, shortDate } from '../../lib/vie'
import { smartFilter } from '../../lib/search'
import { SearchBox, ListNav } from '../../components/ui/ListTools'
import { ClassPick, useClassChoice } from '../gestion/shared'
import VieSheet from './VieSheet'

// Absences et retards d'une classe : totaux par élève, justification des absences, saisie rapide
export default function VieScolairePage() {
  const { classes } = useClasses()
  const { trim } = useView()
  const [classeId, setClasseId] = useClassChoice(classes)
  const [period, setPeriod] = useState(trim)
  const { classe, loading, error, reload, refresh } = useClasse(classeId)
  const run = useRun()
  const [openId, setOpenId] = useState(null)
  const [q, setQ] = useState('')

  const rows = useMemo(() => (classe?.eleves || []).map(e => ({ e, v: vieStats(e, period) }))
    .sort((a, b) => (b.v.absenceHours - b.v.absenceJustified) - (a.v.absenceHours - a.v.absenceJustified) || b.v.retards - a.v.retards), [classe, period])
  const found = smartFilter(rows, q, ({ e }) => `${e.n} ${e.matricule || ''}`)
  const list = usePaged(found.items, { size: 20, resetKey: q + classeId + period })

  const tot = rows.reduce((s, { v }) => ({
    abs: s.abs + v.absenceHours, justified: s.justified + v.absenceJustified, retards: s.retards + v.retards, minutes: s.minutes + v.retardMinutes,
  }), { abs: 0, justified: 0, retards: 0, minutes: 0 })
  const toJustify = rows.flatMap(({ e, v }) => v.list.filter(i => i.type === 'absence' && !i.justified).map(i => ({ e, i })))
    .sort((a, b) => (b.i.date || '').localeCompare(a.i.date || ''))

  const justify = async i => { if (await run(() => incidentsApi.justify(i.id, true), 'Absence justifiée')) refresh() }
  const open = openId && classe?.eleves.find(e => e.id === openId)

  if (!classes.length) return <Empty icon="school" title="Aucune classe" text="Créez d’abord les classes de l’établissement." />
  return <>
    <section className="card">
      <div className="row mrow">
        <ClassPick classes={classes} value={classeId} onChange={setClasseId} />
        <div className="field"><label>Période</label><Picker label="Période" value={period} options={PERIODS.map((p, i) => ({ value: i, label: p }))} onChange={setPeriod} /></div>
      </div>
    </section>

    <Async loading={loading} error={error} onRetry={reload}>
      {classe && <>
        <div className="kpis k3">
          <div className="kpi"><Icon name="user" /><b>{fmtHours(tot.abs - tot.justified)} h</b><span>Absences non justifiées</span></div>
          <div className="kpi"><Icon name="checkc" /><b>{fmtHours(tot.justified)} h</b><span>Absences justifiées</span></div>
          <div className="kpi"><Icon name="clock" /><b>{tot.retards}</b><span>Retards{tot.minutes ? ` · ${tot.minutes} min` : ''}</span></div>
        </div>

        {toJustify.length > 0 && (
          <section className="card">
            <h2><Icon name="bell" /> Absences à justifier <span className="count">{toJustify.length}</span></h2>
            <p className="mut">Un parent apporte un justificatif ? Validez l’absence : elle ne sera plus comptée comme injustifiée.</p>
            <ul className="vie-list">
              {toJustify.slice(0, 30).map(({ e, i }) => (
                <li key={i.id} className="k-absence">
                  <Icon name="user" size={18} />
                  <div><b>{e.n}</b><div className="mut">{shortDate(i.date)} · {fmtHours(i.hours)} h{i.motif ? ` · ${i.motif}` : ''}</div></div>
                  <button className="btn sm" onClick={() => justify(i)}><Icon name="check" size={14} /> Justifier</button>
                </li>
              ))}
            </ul>
            {toJustify.length > 30 && <p className="mut center">Et {toJustify.length - 30} autres.</p>}
          </section>
        )}

        <section className="card">
          <h2><Icon name="users" /> {classe.name} · {PERIODS[period]} <span className="count">{classe.eleves.length}</span></h2>
          <p className="mut">Touchez un élève pour enregistrer un retard ou une absence, ou voir son historique.</p>
          {classe.eleves.length > 8 && <SearchBox value={q} onChange={setQ} count={found.items.length} total={rows.length} fuzzy={found.fuzzy} />}
          {classe.eleves.length === 0 && <p className="mut center">Aucun élève dans cette classe.</p>}
          <ol className="slist">
            {list.shown.map(({ e, v }) => {
              const unj = v.absenceHours - v.absenceJustified
              return (
                <li key={e.id}>
                  <button className="srow btnrow" onClick={() => setOpenId(e.id)}>
                    <span className="sname"><b>{e.n}</b>
                      <span className="mut">{v.absences || v.retards ? [
                        v.absences ? `${fmtHours(v.absenceHours)} h d’absence${v.absenceJustified ? ` (${fmtHours(v.absenceJustified)} justifiées)` : ''}` : '',
                        v.retards ? `${v.retards} retard${v.retards > 1 ? 's' : ''}${v.retardMinutes ? ` · ${v.retardMinutes} min` : ''}` : '',
                      ].filter(Boolean).join(' · ') : 'Rien à signaler'}</span></span>
                    {unj >= 4 && <span className="tag ko">{fmtHours(unj)} h</span>}
                    {unj < 4 && (v.absences > 0 || v.retards > 0) && <span className="tag gold">à suivre</span>}
                    <Icon name="chev-right" size={16} className="sgo" />
                  </button>
                </li>
              )
            })}
          </ol>
          <ListNav nav={list} />
        </section>
        {open && <VieSheet eleve={open} classe={classe} tr={period === ANNUAL ? Math.min(trim, 2) : period} onClose={() => setOpenId(null)} onChanged={refresh} />}
      </>}
    </Async>
  </>
}
