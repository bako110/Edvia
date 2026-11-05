import { request, http } from './client'

export const authApi = {
  login: (login, password) => request('POST', '/auth/login', { login, password }, { auth: false }),
  register: data => request('POST', '/auth/register', data, { auth: false }),
  me: () => http.get('/me'),
  changePassword: (old, password) => http.post('/me/password', { old, password }),
}
