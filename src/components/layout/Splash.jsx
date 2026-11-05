import { useEffect, useState } from 'react'
import SchoolMark from '../ui/SchoolMark'
import { cachedBrand } from '../../context/AuthContext'

// Écran de démarrage animé, aux couleurs de l’établissement (mémorisées à la dernière connexion)
export default function Splash({ onDone }) {
  const [out, setOut] = useState(false)
  const b = cachedBrand()
  const title = b?.name || 'EDVIA'
  useEffect(() => {
    const a = setTimeout(() => setOut(true), 2000)
    const c = setTimeout(onDone, 2500)
    return () => { clearTimeout(a); clearTimeout(c) }
  }, [onDone])
  const skip = () => { setOut(true); setTimeout(onDone, 350) }
  let n = 0
  return (
    <div className={'splash' + (out ? ' out' : '')} onClick={skip} role="presentation">
      <div className="splash-glow" />
      <div className="splash-body">
        <div className="splash-logo"><SchoolMark logo={b?.logo} size={104} id="sp" /></div>
        <h1 className="splash-title">
          {title.split(' ').map((w, wi) => (
            <span className="w" key={wi}>
              {w.split('').map(c => { n++; return <span key={n} style={{ '--d': 0.45 + n * 0.04 + 's' }}>{c}</span> })}
            </span>
          ))}
        </h1>
        <p className="splash-tag">{b?.slogan || 'Notes · Moyennes · Bulletins'}</p>
        <div className="splash-bar"><i /></div>
        {b?.name && <p className="splash-by">Propulsé par EDVIA</p>}
      </div>
      <div className="splash-flag"><i /><i /><i /></div>
    </div>
  )
}
