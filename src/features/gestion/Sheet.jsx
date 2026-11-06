import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../components/ui/Icon'

// Panneau modal (même présentation que le sélecteur et la vie scolaire)
export default function Sheet({ title, sub, onClose, children }) {
  useEffect(() => {
    const key = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = prev }
  }, [onClose])
  return createPortal(
    <div className="pov noprint" onClick={onClose}>
      <div className="psheet vie" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="pgrab" />
        <div className="psheet-h">
          <div><h3>{title}</h3>{sub && <div className="mut">{sub}</div>}</div>
          <button className="btn icon-btn sm" onClick={onClose} aria-label="Fermer"><Icon name="close" size={18} /></button>
        </div>
        {children}
      </div>
    </div>, document.body)
}
