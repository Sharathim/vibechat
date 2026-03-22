export function getThumbnailUrl(url: string | null): string {
  if (!url) return ''
  // Proxy through our backend to avoid CORS issues
  return `http://localhost:5000/api/music/thumbnail?url=${encodeURIComponent(url)}`
}