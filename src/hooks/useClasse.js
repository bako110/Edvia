import { useState, useEffect, useCallback } from 'react'
import { classesApi } from '../api'
import { toClasse } from '../lib/adapters'

// Charge les données d'une classe (élèves, matières, notes, vie scolaire) dans la forme de lib/calc.js
export function useClasse(id) {
  const [state, setState] = useState({ classe: null, loading: !!id, error: null })
  const load = useCallback(async silent => {
    if (!id) { setState({ classe: null, loading: false, error: null }); return }
    if (!silent) setState(s => ({ ...s, loading: true, error: null }))
    try { setState({ classe: toClasse(await classesApi.full(id)), loading: false, error: null }) }
    catch (e) { setState(s => (silent ? s : { classe: null, loading: false, error: e.message })) }
  }, [id])
  useEffect(() => { load(false) }, [load])
  // mise à jour locale (saisie instantanée avant confirmation du serveur)
  const patch = useCallback(fn => setState(s => (s.classe ? { ...s, classe: fn(s.classe) } : s)), [])
  return {
    ...state,
    reload: () => load(false),     // recharge avec indicateur de chargement
    refresh: () => load(true),     // recharge en silence (l'écran ne clignote pas)
    patch,
  }
}
