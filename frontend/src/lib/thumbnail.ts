import { API_BASE_URL } from '../config'

export function getThumbnailUrl(url: string | null): string {
  if (!url) return ''
  // Proxy through our backend to avoid CORS issues
  return `${API_BASE_URL}/api/music/thumbnail?url=${encodeURIComponent(url)}`
}