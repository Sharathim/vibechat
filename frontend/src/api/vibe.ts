import client from './client'

export const vibeApi = {
  sendRequest: (toUserId: number, isCohost: boolean) =>
    client.post('/api/vibe/request', {
      to_user_id: toUserId,
      is_cohost: isCohost,
    }),

  acceptRequest: (fromUserId: number, isCohost: boolean) =>
    client.post('/api/vibe/request/accept', {
      from_user_id: fromUserId,
      is_cohost: isCohost,
    }),

  getState: (sessionId: number) =>
    client.get(`/api/vibe/${sessionId}/state`),

  syncPlayback: (
    sessionId: number,
    songId: number,
    position: number,
    state: string
  ) =>
    client.post(`/api/vibe/${sessionId}/sync`, {
      song_id: songId,
      position,
      state,
    }),

  addToQueue: (sessionId: number, songId: number) =>
    client.post(
      `/api/vibe/${sessionId}/queue/add`,
      { song_id: songId }
    ),

  removeFromQueue: (sessionId: number, songId: number) =>
    client.delete(
      `/api/vibe/${sessionId}/queue/${songId}`
    ),

  endSession: (sessionId: number) =>
    client.post(`/api/vibe/${sessionId}/end`),

  getRecaps: (conversationId: number) =>
    client.get(`/api/vibe/recaps/${conversationId}`),
}

export default vibeApi