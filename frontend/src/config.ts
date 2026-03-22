const isProd = import.meta.env.PROD

export const API_BASE_URL = isProd
  ? 'https://vibechat.ddns.net'
  : 'http://localhost:5000'

export const SOCKET_URL = isProd
  ? 'https://vibechat.ddns.net'
  : 'http://localhost:5000'