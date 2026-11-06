import { http } from './client'

export const auditApi = {
  list: (q = {}) => http.get('/audit' + (Object.keys(q).length ? '?' + new URLSearchParams(q) : '')),
}
