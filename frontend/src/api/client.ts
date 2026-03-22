import axios from 'axios'
import { API_BASE_URL } from '../config.ts'

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
    if (error.response?.status === 401) {
      localStorage.removeItem('vibechat-user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client