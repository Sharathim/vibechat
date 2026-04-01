// API and Socket URLs - configurable via environment variables
// In development: uses localhost
// In production: uses VITE_API_URL and VITE_WS_URL from build args

const defaultOrigin =
	typeof window !== 'undefined' ? window.location.origin : 'http://localhost:7001'

const apiUrlFromEnv = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
const wsUrlFromEnv = (import.meta.env.VITE_WS_URL || '').trim().replace(/\/$/, '')

export const API_BASE_URL = apiUrlFromEnv || defaultOrigin
export const SOCKET_URL = wsUrlFromEnv || defaultOrigin