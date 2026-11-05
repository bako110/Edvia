import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { authApi, apiReady, getToken, setToken, onUnauthorized } from '../api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

// Identité visuelle mémorisée : l'écran de démarrage et la connexion aux couleurs de l'école
const BRAND_KEY = 'edvia_brand'
export function cachedBrand() {
  try { return JSON.parse(localStorage.getItem(BRAND_KEY)) || null } catch { return null }
}
function cacheBrand(s) {
  try { localStorage.setItem(BRAND_KEY, JSON.stringify({ name: s.name, brand: s.brand, logo: s.logo, slogan: s.slogan })) } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, school: null })

  const start = useCallback(({ token, user, school }) => {
    if (token) setToken(token)
    cacheBrand(school)
    setState({ status: 'ready', user, school })
  }, [])
  const logout = useCallback(() => { setToken(null); setState({ status: 'anon', user: null, school: null }) }, [])

  // On attend que le serveur à utiliser soit choisi (local d'abord, sinon en ligne), puis on rouvre la session de CE serveur
  useEffect(() => {
    apiReady().then(() => {
      if (!getToken()) { setState({ status: 'anon', user: null, school: null }); return }
      authApi.me().then(start).catch(logout)
    })
  }, [start, logout])
  useEffect(() => onUnauthorized(logout), [logout])

  const value = useMemo(() => ({
    ...state,
    login: async (login, password) => start(await authApi.login(login, password)),
    register: async data => start(await authApi.register(data)),
    logout,
    setSchool: school => { cacheBrand(school); setState(s => ({ ...s, school })) },
    passwordChanged: () => setState(s => ({ ...s, user: { ...s.user, mustChange: false } })),
    isAdmin: state.user?.role === 'admin',
  }), [state, start, logout])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
