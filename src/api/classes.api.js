import { http } from './client'

export const classesApi = {
  list: () => http.get('/classes'),
  create: (name, defaults = true) => http.post('/classes', { name, defaults }),
  update: (id, data) => http.put(`/classes/${id}`, data),
  remove: id => http.del(`/classes/${id}`),
  full: id => http.get(`/classes/${id}/full`),
  addMatiere: (id, data) => http.post(`/classes/${id}/matieres`, data),
  updateMatiere: (id, mid, data) => http.put(`/classes/${id}/matieres/${mid}`, data),
  removeMatiere: (id, mid) => http.del(`/classes/${id}/matieres/${mid}`),
}
