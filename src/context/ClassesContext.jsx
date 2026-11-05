import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { classesApi } from '../api'

const Ctx = createContext(null)
export const useClasses = () => useContext(Ctx)

// Liste des classes accessibles à l'utilisateur connecté (administrateur : toutes ; enseignant : les siennes)
export function ClassesProvider({ children }) {
  const [state, setState] = useState({ classes: [], loading: true, error: null })
  const reload = useCallback(async () => {
    try { setState({ classes: await classesApi.list(), loading: false, error: null }) }
    catch (e) { setState(s => ({ ...s, loading: false, error: e.message })) }
  }, [])
  useEffect(() => { reload() }, [reload])
  const value = useMemo(() => ({ ...state, reload, fullAccess: state.classes.filter(c => c.access === 'full') }), [state, reload])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
