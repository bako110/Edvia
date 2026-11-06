import { http } from './client'

export const devoirsApi = {
  list: () => http.get('/devoirs'),
  create: data => http.post('/devoirs', data),
  upload: (id, buffer) => http.putRaw(`/devoirs/${id}/fichier`, buffer),
  file: id => http.getBuffer(`/devoirs/${id}/fichier`),
  remove: id => http.del(`/devoirs/${id}`),
}
