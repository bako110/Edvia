import { useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/Feedback'
import { elevesApi } from '../../api'

// Observations du conseil de classe : affichage immédiat, enregistrement différé.
// Modifiables par l'administration, le personnel et le professeur principal.
export function useObservations(classe, patch) {
  const { user } = useAuth()
  const toast = useToast()
  const timers = useRef(new Map())
  const editable = user.role === 'admin' || user.role === 'staff' || classe.principalId === user.id
  return (e, tr) => ({
    value: e.obs?.[tr], editable,
    onChange: text => {
      patch(c => ({ ...c, eleves: c.eleves.map(x => (x.id === e.id ? { ...x, obs: { ...x.obs, [tr]: text } } : x)) }))
      clearTimeout(timers.current.get(e.id + tr))
      timers.current.set(e.id + tr, setTimeout(() => elevesApi.setObs(e.id, tr, text).catch(err => toast(err.message, 'err')), 800))
    },
  })
}
