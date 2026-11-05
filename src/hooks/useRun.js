import { useCallback } from 'react'
import { useToast } from '../context/Feedback'

// Exécute une action asynchrone en affichant l’erreur (toast) ; renvoie le résultat ou undefined
export function useRun() {
  const toast = useToast()
  return useCallback(async (fn, successMessage) => {
    try {
      const r = await fn()
      if (successMessage) toast(successMessage)
      return r === undefined ? true : r
    } catch (e) { toast(e.message, 'err'); return undefined }
  }, [toast])
}
