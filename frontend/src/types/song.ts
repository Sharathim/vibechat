export interface Song {
  id: number
  youtubeId?: string
  youtube_id?: string
  title: string
  artist: string
  thumbnailUrl: string
  thumbnail_url?: string
  audioUrl: string | null
  s3_audio_url?: string | null
  duration: number
}

export interface Playlist {
  id: number
  name: string
  coverUrl: string | null
  songCount: number
  isShared: boolean
  sharedWith: string | null
  createdAt: string
  songs?: Song[]
}

export interface HistoryItem {
  id: number
  song: Song
  playedAt: string
}

export interface SearchHistoryItem {
  id: number
  type: 'song' | 'user'
  song?: Song
  user?: {
    id: number
    name: string
    username: string
    avatarUrl: string | null
  }
  searchedAt: string
}