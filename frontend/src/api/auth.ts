import client from './client'

export const authApi = {
  checkEmail: (gmail: string) =>
    client.post('/auth/check-email', { gmail }),

  sendOTP: (gmail: string, purpose: string) =>
    client.post('/auth/send-otp', { gmail, purpose }),

  verifyOTP: (gmail: string, otp: string, purpose: string) =>
    client.post('/auth/verify-otp', { gmail, otp, purpose }),

  checkUsername: (username: string) =>
    client.post('/auth/check-username', { username }),

  register: (data: {
    gmail: string
    username: string
    name: string
    password: string
  }) => client.post('/auth/register', data),

  login: (identifier: string, password: string) =>
    client.post('/auth/login', { identifier, password }),

  logout: () =>
    client.post('/auth/logout'),

  forgotPassword: (gmail: string) =>
    client.post('/auth/forgot-password', { gmail }),

  resetPassword: (gmail: string, password: string) =>
    client.post('/auth/reset-password', { gmail, password }),

  me: () =>
    client.get('/auth/me'),

  // Google OAuth login - send Firebase ID token to backend for verification
  googleLogin: (idToken: string) =>
    client.post('/auth/google', { idToken }),
}

export default authApi