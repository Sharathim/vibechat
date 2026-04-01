import client from './client'

export const authApi = {
  // Verify Google ID token and check if user exists
  googleAuth: (idToken: string) =>
    client.post('/auth/google', { idToken, token: idToken }),

  // Check username availability
  checkUsername: (username: string) =>
    client.post('/auth/check-username', { username }),

  // Create user account (complete profile)
  createUser: (data: {
    googleId: string
    email: string
    name: string
    username: string
    password: string
    confirmPassword: string
  }) => client.post('/auth/create-user', data),

  // Get current session user
  me: () =>
    client.get('/auth/me'),

  // Logout
  logout: () =>
    client.post('/auth/logout'),
}

export default authApi