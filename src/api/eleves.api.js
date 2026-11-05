import { http } from './client'

export const elevesApi = {
  add: (classeId, names) => http.post(`/classes/${classeId}/eleves`, { names }),
  update: (id, data) => http.put(`/eleves/${id}`, data),
  remove: id => http.del(`/eleves/${id}`),
  setObs: (id, tr, text) => http.put(`/eleves/${id}/obs`, { tr, text }),
}
