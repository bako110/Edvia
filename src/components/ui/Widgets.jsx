import { useEffect, useRef, useState } from 'react'
import { f } from '../../lib/calc'

// Nombre qui s'anime jusqu'à sa valeur
export function CountUp({ value, decimals = 2, suffix = '' }) {
  const [v, setV] = useState(value ?? 0)
  const from = useRef(value ?? 0)
  useEffect(() => {
    if (value === null || value === undefined) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setV(value); from.current = value; return }
    const a = from.current, t0 = performance.now(), D = 700
    let raf
    const step = t => {
      const p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3)
      setV(a + (value - a) * e)
      if (p < 1) raf = requestAnimationFrame(step); else from.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  if (value === null || value === undefined) return <>—</>
  return <>{f(v, decimals)}{suffix}</>
}

// Anneau de progression
export function Ring({ pct, size = 88, label }) {
  const [on, setOn] = useState(false)
  useEffect(() => { const r = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(r) }, [])
  const r = 36, c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 88 88" width={size} height={size}>
        <circle cx="44" cy="44" r={r} className="ring-bg" />
        <circle cx="44" cy="44" r={r} className="ring-fg" strokeDasharray={c}
          strokeDashoffset={on ? c * (1 - pct / 100) : c} transform="rotate(-90 44 44)" />
      </svg>
      <div className="ring-t"><b>{pct}%</b>{label && <span>{label}</span>}</div>
    </div>
  )
}

// Histogramme de répartition des moyennes
export function DistChart({ bins }) {
  const [on, setOn] = useState(false)
  useEffect(() => { const r = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(r) }, [])
  const max = Math.max(1, ...bins.map(b => b.n))
  return (
    <div className="dist" role="img" aria-label="Répartition des moyennes par tranche">
      {bins.map((b, i) => (
        <div className="dist-c" key={b.label}>
          <span className="dist-n">{b.n || ''}</span>
          <div className="dist-track">
            <div className={'dist-bar ' + (b.low ? 'low' : 'ok')}
              style={{ height: on ? (b.n / max) * 100 + '%' : '0%', transitionDelay: i * 60 + 'ms' }} />
          </div>
          <span className="dist-l">{b.label}</span>
        </div>
      ))}
    </div>
  )
}
