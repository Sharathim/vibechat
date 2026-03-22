    import client from './client'

export const searchApi = {
  searchSongs: (query: string) =>
    client.get('/api/search/songs', { params: { q: query } }),

  searchUsers: (query: string) =>
    client.get('/api/search/users', { params: { q: query } }),

  getHistory: (type: 'song' | 'user') =>
    client.get(`/api/search/history/${type}`),

  addHistory: (type: 'song' | 'user', referenceId: number) =>
    client.post('/api/search/history', {
      type,
      reference_id: referenceId,
    }),

  removeHistoryItem: (id: number) =>
    client.delete(`/api/search/history/${id}`),

  clearHistory: (type: 'song' | 'user') =>
    client.delete(`/api/search/history/${type}/all`),
}

export default searchApi