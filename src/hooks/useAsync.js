import { useState, useEffect, useCallback, useRef } from 'react'

// Charge des données asynchrones : { data, loading, error, reload }
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const ref = useRef(fn)
  ref.current = fn
  const load = useCallback(async () => {
    try { setState({ data: await ref.current(), loading: false, error: null }) }
    catch (e) { setState(s => ({ ...s, loading: false, error: e.message })) }
  }, []) // eslint-disable-line
  useEffect(() => { load() }, [load, ...deps]) // eslint-disable-line
  return { ...state, reload: load }
}
