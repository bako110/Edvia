import { http } from './client'

export const messagesApi = {
  send: data => http.post('/messages', data),
  history: () => http.get('/messages'),
}
