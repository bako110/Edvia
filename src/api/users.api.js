import { http } from './client'

export const usersApi = {
  list: () => http.get('/users'),
  create: data => http.post('/users', data),
  update: (id, data) => http.put(`/users/${id}`, data),
  resetPassword: (id, password) => http.put(`/users/${id}/password`, { password }),
}
