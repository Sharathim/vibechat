import client from './client'

export const musicApi = {
  // Stream
  getStreamUrl: (youtubeId: string) =>
    client.get(`/api/music/stream/${youtubeId}`),

  // Liked songs
  getLiked: () =>
    client.get('/api/music/liked'),

  likeSong: (songId: number) =>
    client.post(`/api/music/liked/${songId}`),

  unlikeSong: (songId: number) =>
    client.delete(`/api/music/liked/${songId}`),

  // Downloads
  getDownloads: () =>
    client.get('/api/music/downloads'),

  downloadSong: (songId: number) =>
    client.post(`/api/music/downloads/${songId}`),

  removeDownload: (songId: number) =>
    client.delete(`/api/music/downloads/${songId}`),

  // History
  getHistory: () =>
    client.get('/api/music/history'),

  logPlay: (songId: number) =>
    client.post('/api/music/history', { song_id: songId }),

  deleteHistoryItem: (historyId: number) =>
    client.delete(`/api/music/history/${historyId}`),

  clearHistory: () =>
    client.delete('/api/music/history/all'),

  // Playlists
  getPlaylists: () =>
    client.get('/api/music/playlists'),

  createPlaylist: (name: string) =>
    client.post('/api/music/playlists', { name }),

  getPlaylist: (id: number) =>
    client.get(`/api/music/playlists/${id}`),

  updatePlaylist: (id: number, name: string) =>
    client.put(`/api/music/playlists/${id}`, { name }),

  deletePlaylist: (id: number) =>
    client.delete(`/api/music/playlists/${id}`),

  addToPlaylist: (playlistId: number, songId: number) =>
    client.post(`/api/music/playlists/${playlistId}/songs`,
      { song_id: songId }),

  removeFromPlaylist: (playlistId: number, songId: number) =>
    client.delete(
      `/api/music/playlists/${playlistId}/songs/${songId}`
    ),

  // Shared playlists
  getSharedPlaylists: () =>
    client.get('/api/music/shared-playlists'),

  deleteSharedPlaylist: (id: number) =>
    client.delete(`/api/music/shared-playlists/${id}`),
}

export default musicApi