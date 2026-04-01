import axios from 'axios'
import { API_BASE_URL } from '../config.ts'

const AUTH_401_EXEMPT_PATHS = [
  '/auth/google',
  '/auth/check-username',
  '/auth/create-user',
  '/auth/me',
]

function shouldAutoLogoutOn401(requestUrl?: string): boolean {
  const url = (requestUrl || '').toString()
  if (!url) return true
  return !AUTH_401_EXEMPT_PATHS.some((path) => url.includes(path))
}

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url as string | undefined
    if (error.response?.status === 401 && shouldAutoLogoutOn401(requestUrl)) {
      localStorage.removeItem('vibechat-user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client