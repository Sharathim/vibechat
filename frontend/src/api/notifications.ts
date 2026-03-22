import client from './client'

export const notificationsApi = {
  getNotifications: () =>
    client.get('/api/notifications'),

  markRead: (id: number) =>
    client.post(`/api/notifications/read/${id}`),

  markAllRead: () =>
    client.post('/api/notifications/read-all'),

  getUnreadCount: () =>
    client.get('/api/notifications/unread-count'),
}

export default notificationsApi