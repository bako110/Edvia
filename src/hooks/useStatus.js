import { useState, useEffect, useCallback } from 'react'
import { notesApi } from '../api'

// État de saisie des notes par matière et par classe (qui n'a pas renseigné ?)
export function useStatus(tr) {
  const [state, setState] = useState({ rows: [], loading: true, error: null })
  const load = useCallback(async () => {
    try { setState({ rows: await notesApi.status(tr), loading: false, error: null }) }
    catch (e) { setState(s => ({ ...s, loading: false, error: e.message })) }
  }, [tr])
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}
