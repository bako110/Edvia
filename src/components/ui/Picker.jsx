import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { norm } from '../../lib/calc'

// Sélecteur tactile : un bouton qui ouvre un panneau (bottom sheet) avec les choix
export default function Picker({ label, title, value, options, onChange, columns = 1, variant = 'field', searchable = false }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const cur = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    setQ('')
    const key = e => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', key)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = prev }
  }, [open])

  const list = q ? options.filter(o => norm(o.label).includes(norm(q))) : options
  const pick = v => { onChange(v); setOpen(false) }

  return <>
    <button type="button" className={'pick ' + variant} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`${label} : ${cur ? cur.label : ''}`}>
      {(variant === 'head' || variant === 'bar') && <span className="pick-l">{label}</span>}
      <span className="pick-v">{cur ? cur.label : '—'}</span>
      <Icon name="chev-down" size={16} />
    </button>
    {open && createPortal(
      <div className="pov noprint" onClick={() => setOpen(false)}>
        <div className="psheet" role="dialog" aria-modal="true" aria-label={title || label} onClick={e => e.stopPropagation()}>
          <div className="pgrab" />
          <div className="psheet-h"><h3>{title || label}</h3>
            <button className="btn icon-btn sm" onClick={() => setOpen(false)} aria-label="Fermer"><Icon name="close" size={18} /></button></div>
          {searchable && (
            <div className="search"><Icon name="search" size={18} />
              <input type="search" autoFocus placeholder="Rechercher" value={q} onChange={e => setQ(e.target.value)} /></div>
          )}
          <div className="popts" style={{ '--cols': columns }}>
            {list.map(o => (
              <button key={String(o.value)} className={'popt' + (o.value === value ? ' on' : '')} onClick={() => pick(o.value)}>
                <span className="popt-l">{o.label}</span>
                {o.sub && <small>{o.sub}</small>}
                {o.value === value && <Icon name="check" size={16} />}
              </button>
            ))}
          </div>
          {!list.length && <p className="mut center">Aucun résultat</p>}
        </div>
      </div>, document.body)}
  </>
}
