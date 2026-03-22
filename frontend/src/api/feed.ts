import client from './client'

export const feedApi = {
  getFeed: (page = 1) =>
    client.get('/api/feed', { params: { page } }),

  getClips: () =>
    client.get('/api/clips'),

  postClip: (songId: number, startSeconds: number) =>
    client.post('/api/clips', {
      song_id: songId,
      start_seconds: startSeconds,
    }),

  viewClip: (clipId: number) =>
    client.post(`/api/clips/${clipId}/view`),

  deleteClip: (clipId: number) =>
    client.delete(`/api/clips/${clipId}`),
}

export default feedApi