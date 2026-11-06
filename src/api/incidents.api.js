import { http } from './client'

export const incidentsApi = {
  create: (eleveId, data) => http.post(`/eleves/${eleveId}/incidents`, data),
  justify: (id, justified) => http.put(`/incidents/${id}`, { justified }),
  remove: id => http.del(`/incidents/${id}`),
}
