// API and Socket URLs - configurable via environment variables
// In development: uses localhost
// In production: uses VITE_API_URL and VITE_WS_URL from build args

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5006'

export const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5006'