import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TR, ANNUAL, getN, getPen, moyMat, moyMatAnnual, rangMat, missingFor, vieStats, f, fn, rk, appr, mention, decision } from '../../lib/calc'
import { describe, fmtHours, shortDate } from '../../lib/vie'

const A4_PX = 793.7   // 210 mm à 96 dpi
const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const low = v => v !== null && v < 10

/*
 * Ajustement automatique : le bulletin mesure sa hauteur et se resserre, palier par palier
 * (0 = aéré … 5 = très serré), jusqu'à tenir sur UNE page A4 — quel que soit le nombre de matières
 * ou de signalements de vie scolaire.
 */
const LevelCtx = createContext(0)
const MAX_LEVEL = 5
const LINES = [5, 4, 3, 2, 0, 0]   // lignes de détail de la vie scolaire affichées selon le palier
const startLevel = n => (n <= 8 ? 0 : n <= 11 ? 1 : n <= 15 ? 2 : n <= 20 ? 3 : 4)

/* ---------- cadre commun d’un bulletin (une feuille A4) ---------- */
function Frame({ school, classe, title, subtitle, o, r, index, total, children, obsProps, obsKey }) {
  const miss = missingFor(o.e, classe, obsKey)
  const n = classe.matieres.length
  const obs = obsProps(o.e, obsKey)

  const base = startLevel(n)
  const sig = [o.e.inc.length, miss.length, (obs.value || '').length, o.e.matricule, school.logo ? 1 : 0].join('|')
  const [lv, setLv] = useState(base)
  const ref = useRef(null)
  useEffect(() => { setLv(base) }, [base, sig])                                   // les données changent : on repart du palier de base
  useEffect(() => { document.fonts?.ready.then(() => setLv(base)) }, [base])      // polices chargées : on réévalue
  useLayoutEffect(() => {                                                          // trop haut ? on resserre d'un cran
    const el = ref.current
    if (el && lv < MAX_LEVEL && el.scrollHeight > el.clientHeight + 1) setLv(lv + 1)
  })
  return (
    <article ref={ref} className={'sheet lv' + lv}>
      <header className="sh-head">
        <div className="sh-left"><b>Burkina Faso</b>{school.devise && <i>{school.devise}</i>}<span>{school.ministere}</span></div>
        <div className="sh-logo">{school.logo && <img src={school.logo} alt="" />}</div>
        <div className="sh-right"><h3>{school.name}</h3><span>Année scolaire {school.annee}</span></div>
      </header>

      <div className="sh-title"><h2>{title}</h2><small>{subtitle}</small></div>

      {miss.length > 0 && (
        <div className="sh-prov"><b>Bulletin provisoire</b> — notes non renseignées : {miss.map(m => (m.teacherName ? `${m.n} (${m.teacherName})` : m.n)).join(', ')}</div>
      )}

      <dl className="sh-id">
        <div className="nm"><dt>Élève</dt><dd>{o.e.n}</dd></div>
        {o.e.matricule && <div><dt>Matricule</dt><dd>{o.e.matricule}</dd></div>}
        <div><dt>Classe</dt><dd>{classe.name}</dd></div>
        <div><dt>Effectif</dt><dd>{r.tot}</dd></div>
      </dl>

      <LevelCtx.Provider value={lv}>{children}</LevelCtx.Provider>

      <div className="sh-grow" />

      <section className="sh-obs">
        <span className="sh-lab">Observations du conseil de classe</span>
        {obs.editable && <textarea rows="2" value={obs.value || ''} placeholder="Saisir une observation (facultatif)" onChange={e => obs.onChange(e.target.value)} />}
        <div className="obs-print" style={obs.editable ? undefined : { display: 'block' }}>{obs.value}</div>
      </section>

      <div className="sh-sig">
        <div><span>Le parent ou tuteur</span></div>
        <div><span>Le professeur principal</span><b>{classe.principalName}</b></div>
        <div><span>Le proviseur</span><b>{school.proviseur}</b></div>
      </div>

      {o.e.seals?.[obsKey] && (
        <div className="sh-seal">
          <span><b>Code d’authenticité</b> {o.e.seals[obsKey]}</span><span>Réf. {o.e.ref}</span>
          <span>Vérifier : {location.origin}{location.pathname}#/verifier</span>
        </div>
      )}
      <footer className="sh-foot"><span>Édité le {today()}</span><span>{school.name}</span><span>Bulletin {index} / {total}</span></footer>
    </article>
  )
}

const PRIORITY = { sanction: 0, penalite: 1, comportement: 2, absence: 3, retard: 4 }

// Vie scolaire : retards, absences, comportement, pénalités (avec motif et auteur) et sanctions
function Vie({ o, period, classe }) {
  const max = LINES[useContext(LevelCtx)]
  const v = vieStats(o.e, period)
  const ordered = [...v.list].sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type] || a.date.localeCompare(b.date))
  const shown = ordered.slice(0, max), more = v.list.length - shown.length
  return (
    <section className="sh-vie">
      <span className="sh-lab">Vie scolaire et discipline</span>
      <div className="sh-vgrid">
        <div><b>{v.retards}</b><span>Retard{v.retards > 1 ? 's' : ''}{v.retardMinutes ? ` · ${v.retardMinutes} min` : ''}</span></div>
        <div><b>{fmtHours(v.absenceHours)} h</b><span>Absences{v.absenceHours ? ` · dont ${fmtHours(v.absenceJustified)} h justifiées` : ''}</span></div>
        <div><b>{v.comportements}</b><span>Incident{v.comportements > 1 ? 's' : ''} de comportement</span></div>
        <div><b className={v.penaltyPoints ? 'lw' : ''}>{v.penaltyPoints ? '−' + fmtHours(v.penaltyPoints) : '0'}</b><span>Point{v.penaltyPoints > 1 ? 's' : ''} de pénalité</span></div>
      </div>
      {max === 0 && v.sanctions.length > 0 && <p className="sh-vsan">Sanction : {v.sanctions.map(s => `${s.label} (${s.motif})`).join(' ; ')}</p>}
      {shown.length > 0 && (
        <ul className="sh-vlist">
          {shown.map(i => <li key={i.id} className={'k-' + i.type}><span className="d">{shortDate(i.date)}</span><span>{describe(i, classe)}<i> — {i.byName || 'Administration'}</i></span></li>)}
        </ul>
      )}
      {more > 0 && <p className="sh-vmore">+ {more} autre{more > 1 ? 's' : ''} signalement{more > 1 ? 's' : ''} (détail dans l’application)</p>}
      {v.list.length === 0 && <p className="sh-vnone">Aucun retard, absence, pénalité ou incident signalé.</p>}
    </section>
  )
}

function Summary({ o, r, annual }) {
  return <>
    <div className="sh-sum">
      <div className="sh-stat main"><span>Moyenne {annual ? 'annuelle' : 'générale'}</span><div className="v"><b className={low(o.moy) ? 'lw' : ''}>{f(o.moy)}</b><small> / 20</small></div></div>
      <div className="sh-stat"><span>Rang</span><div className="v"><b>{rk(o.rang)}</b><small> / {r.tot}</small></div></div>
      <div className="sh-stat"><span>Moyenne de la classe</span><div className="v"><b>{f(r.cm)}</b></div></div>
      <div className="sh-stat"><span>Plus forte · plus faible</span><div className="v"><b className="sm">{f(r.max)} · {f(r.min)}</b></div></div>
    </div>
    <div className="sh-verdict">
      <p><span>Appréciation</span><b>{appr(o.moy) || '—'}</b></p>
      <p><span>Mention</span><b>{mention(o.moy) || 'Aucune'}</b></p>
      {annual && <p><span>Décision</span><b>{decision(o.moy) || '—'}{o.moy !== null && o.n < 3 ? ' (provisoire)' : ''}</b></p>}
    </div>
  </>
}

function SheetTrim({ school, classe, tr, r, o, index, total, obsProps }) {
  let tc = 0, tp = 0
  return (
    <Frame school={school} classe={classe} title="Bulletin de notes" subtitle={TR[tr]} o={o} r={r} index={index} total={total} obsProps={obsProps} obsKey={tr}>
      <table className="sh-table">
        <thead><tr><th>Matière</th><th>Coef.</th><th>Devoir 1</th><th>Devoir 2</th><th>Compo.</th><th>Moy. / 20</th><th>Moy. × coef.</th><th>Rang</th><th className="l">Appréciation</th></tr></thead>
        <tbody>
          {classe.matieres.map((m, j) => {
            const a = getN(o.e, tr, j), v = moyMat(o.e, tr, j), ok = v !== null, pen = getPen(o.e, tr, j)
            if (ok) { tc += m.c; tp += v * m.c }
            return (
              <tr key={m.id}><td className="m">{m.n}</td><td>{m.c}</td><td>{fn(a[0])}</td><td>{fn(a[1])}</td><td>{fn(a[2])}</td>
                <td className={'mo' + (low(v) ? ' lw' : '')}>{f(v)}{ok && pen > 0 && <small className="pen">−{f(pen)}</small>}</td><td>{ok ? f(v * m.c) : '—'}</td><td>{ok ? rangMat(classe, tr, j, v) : '—'}</td><td className="ap">{ok ? appr(v) : ''}</td></tr>
            )
          })}
        </tbody>
        <tfoot><tr><td className="m">Total</td><td>{tc}</td><td colSpan="4"></td><td>{f(tp)}</td><td colSpan="2"></td></tr></tfoot>
      </table>
      <Summary o={o} r={r} />
      <Vie o={o} period={tr} classe={classe} />
    </Frame>
  )
}

function SheetAnnual({ school, classe, r, o, index, total, obsProps }) {
  let tc = 0, tp = 0
  return (
    <Frame school={school} classe={classe} title="Bulletin annuel" subtitle="Année complète" o={o} r={r} index={index} total={total} obsProps={obsProps} obsKey={ANNUAL}>
      <table className="sh-table">
        <thead><tr><th>Matière</th><th>Coef.</th><th>1er trim.</th><th>2e trim.</th><th>3e trim.</th><th>Moy. annuelle</th><th>Moy. × coef.</th><th className="l">Appréciation</th></tr></thead>
        <tbody>
          {classe.matieres.map((m, j) => {
            const t = [0, 1, 2].map(x => moyMat(o.e, x, j)), v = moyMatAnnual(o.e, j), ok = v !== null
            if (ok) { tc += m.c; tp += v * m.c }
            return (
              <tr key={m.id}><td className="m">{m.n}</td><td>{m.c}</td>{t.map((x, i) => <td key={i}>{f(x)}</td>)}
                <td className={'mo' + (low(v) ? ' lw' : '')}>{f(v)}</td><td>{ok ? f(v * m.c) : '—'}</td><td className="ap">{ok ? appr(v) : ''}</td></tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr><td className="m">Total</td><td>{tc}</td><td colSpan="4"></td><td>{f(tp)}</td><td></td></tr>
          <tr className="gen"><td className="m">Moyenne générale</td><td></td>{o.t.map((x, i) => <td key={i}>{f(x)}</td>)}<td>{f(o.moy)}</td><td colSpan="2"></td></tr>
        </tfoot>
      </table>
      <Summary o={o} r={r} annual />
      <Vie o={o} period={ANNUAL} classe={classe} />
    </Frame>
  )
}

/* ---------- aperçu : la feuille garde ses dimensions A4, l’aperçu est simplement réduit pour tenir à l’écran ---------- */
export function Stage({ children }) {
  const ref = useRef(null)
  const [z, setZ] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    const fit = () => {
      const cs = getComputedStyle(el)
      const w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      setZ(Math.max(0.3, Math.min(1, w / A4_PX)))
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return <div className="stage" ref={ref}><div className="stage-in" style={{ zoom: z }}>{children}</div></div>
}

// Une feuille de bulletin (trimestriel ou annuel selon la période)
export function Sheet({ period, ...props }) {
  return period === ANNUAL ? <SheetAnnual {...props} /> : <SheetTrim tr={period} {...props} />
}
