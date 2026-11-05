import { useState, useEffect } from 'react'

// true quand l'écran correspond à la requête (ex. mobile / WebView étroite)
export function useMedia(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const h = e => setM(e.matches)
    setM(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [q])
  return m
}
