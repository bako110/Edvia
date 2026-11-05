import { createContext, useContext, useState, useMemo, useCallback } from 'react'

const Ctx = createContext(null)
export const useView = () => useContext(Ctx)

const KEY = 'edvia_view'
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {} } catch { return {} } }

// Sélection courante : classe + période (0..2 trimestres, 3 = année complète)
export function ViewProvider({ children }) {
  const [v, setV] = useState(() => ({ classId: null, period: 0, ...load() }))
  const set = useCallback(patch => setV(prev => {
    const next = { ...prev, ...patch }
    try { sessionStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
    return next
  }), [])
  const value = useMemo(() => ({
    classId: v.classId, period: v.period,
    trim: Math.min(v.period, 2),            // pour les pages qui ne travaillent que par trimestre
    annual: v.period === 3,
    setClassId: classId => set({ classId }),
    setPeriod: period => set({ period }),
  }), [v, set])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// Classe sélectionnée parmi une liste (la première si la sélection n'est plus valide)
export function pickClass(list, classId) {
  return list.find(c => c.id === classId) || list[0] || null
}
