import client from './client'

export const musicApi = {
  // Stream
  getStreamUrl: (youtubeId: string) =>
    client.get(`/api/music/stream/${youtubeId}`),

  // Upsert song metadata on selection
  upsertSong: (youtubeId: string) =>
    client.post('/api/music/songs', { youtube_id: youtubeId }),

  // Liked songs
  getLiked: () =>
    client.get('/api/music/liked'),

  likeSong: (youtubeId: string) =>
    client.post(`/api/music/liked/${youtubeId}`),

  unlikeSong: (youtubeId: string) =>
    client.delete(`/api/music/liked/${youtubeId}`),

  // History
  logPlay: (youtubeId: string) =>
    client.post('/api/music/history', { youtube_id: youtubeId }),

  getHistory: () =>
    client.get('/api/music/history'),
}

export default musicApi