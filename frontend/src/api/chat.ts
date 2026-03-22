import client from './client'

export const chatApi = {
  getConversations: () =>
    client.get('/api/chat/conversations'),

  getOrCreateConversation: (otherUserId: number) =>
    client.post(
      `/api/chat/conversations/with/${otherUserId}`
    ),

  getMessages: (convId: number, offset = 0) =>
    client.get(
      `/api/chat/conversations/${convId}/messages`,
      { params: { offset } }
    ),

  sendMessage: (
    convId: number,
    content: string,
    type = 'text'
  ) =>
    client.post(
      `/api/chat/conversations/${convId}/messages`,
      { content, type }
    ),

  clearChat: (convId: number) =>
    client.post(
      `/api/chat/conversations/${convId}/clear`
    ),

  removeConversation: (convId: number) =>
    client.delete(`/api/chat/conversations/${convId}`),

  blockVibe: (convId: number) =>
    client.post(
      `/api/chat/conversations/${convId}/block-vibe`
    ),
}

export default chatApi