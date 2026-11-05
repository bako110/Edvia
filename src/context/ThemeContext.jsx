import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const KEY = 'edvia_theme'   // 'auto' | 'light' | 'dark' — préférence propre à l’appareil
const Ctx = createContext({ theme: 'auto', setTheme: () => {}, cycle: () => {} })
export const useTheme = () => useContext(Ctx)
const NEXT = { auto: 'light', light: 'dark', dark: 'auto' }

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => { try { return localStorage.getItem(KEY) || 'auto' } catch { return 'auto' } })
  useEffect(() => {
    const el = document.documentElement
    if (theme === 'light' || theme === 'dark') el.dataset.theme = theme
    else delete el.dataset.theme
  }, [theme])
  const setTheme = useCallback(t => { setThemeState(t); try { localStorage.setItem(KEY, t) } catch { /* ignore */ } }, [])
  const cycle = useCallback(() => setTheme(NEXT[theme] || 'light'), [theme, setTheme])
  const value = useMemo(() => ({ theme, setTheme, cycle }), [theme, setTheme, cycle])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
