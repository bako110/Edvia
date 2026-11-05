import { http } from './client'

export const incidentsApi = {
  create: (eleveId, data) => http.post(`/eleves/${eleveId}/incidents`, data),
  remove: id => http.del(`/incidents/${id}`),
}
