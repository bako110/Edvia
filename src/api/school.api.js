import { http } from './client'

export const schoolApi = {
  get: () => http.get('/school'),
  update: data => http.put('/school', data),
  setAnnee: data => http.put('/school/annee', data),
}
