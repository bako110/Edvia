import { http } from './client'

export const financeApi = {
  overview: () => http.get('/finance'),
  classe: id => http.get(`/classes/${id}/finance`),
  setPlan: (id, plan) => http.put(`/classes/${id}/finance`, plan),
  pay: (eleveId, data) => http.post(`/eleves/${eleveId}/paiements`, data),
  cancel: id => http.del(`/paiements/${id}`),
}
