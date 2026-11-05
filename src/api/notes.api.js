import { http } from './client'

export const notesApi = {
  set: (eleveId, matiereId, tr, k, value) => http.put('/notes', { eleveId, matiereId, tr, k, value }),
  status: tr => http.get(`/status?tr=${tr}`),
}
