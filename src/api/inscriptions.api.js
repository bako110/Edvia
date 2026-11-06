import { http } from './client'

export const inscriptionsApi = {
  overview: () => http.get('/inscriptions'),
  enroll: (classeId, data) => http.post(`/classes/${classeId}/inscriptions`, data),
}
