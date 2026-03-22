import client from './client'

export const usersApi = {
  getMyProfile: () =>
    client.get('/api/profile/me'),

  updateProfile: (data: {
    name?: string
    username?: string
    bio?: string
  }) => client.put('/api/profile/me', data),

  uploadAvatar: (imageData: string) =>
    client.post('/api/profile/me/avatar', { image: imageData }),

  getProfile: (username: string) =>
    client.get(`/api/profile/${username}`),

  getFollowers: () =>
    client.get('/api/profile/me/followers'),

  getFollowing: () =>
    client.get('/api/profile/me/following'),

  removeFollower: (userId: number) =>
    client.delete(`/api/profile/me/followers/${userId}`),

  followUser: (userId: number) =>
    client.post(`/api/follow/${userId}`),

  unfollowUser: (userId: number) =>
    client.delete(`/api/follow/${userId}`),

  getFollowRequests: () =>
    client.get('/api/follow/requests'),

  acceptFollowRequest: (requestId: number) =>
    client.post(`/api/follow/requests/${requestId}/accept`),

  declineFollowRequest: (requestId: number) =>
    client.post(`/api/follow/requests/${requestId}/decline`),
}

export default usersApi