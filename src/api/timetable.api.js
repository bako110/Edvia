import { http } from './client'

export const timetableApi = {
  classe: id => http.get(`/classes/${id}/emploi-du-temps`),
  all: () => http.get('/emploi-du-temps'),
  mine: () => http.get('/emploi-du-temps/mon'),
  create: (classeId, data) => http.post(`/classes/${classeId}/creneaux`, data),
  update: (id, data) => http.put(`/creneaux/${id}`, data),
  remove: id => http.del(`/creneaux/${id}`),
}
