export interface Song {
  // Main identifier
  youtubeId: string

  // Core metadata
  title: string
  artist: string
  duration: number // in seconds
  thumbnailUrl: string

  // Optional metadata from YouTube
  youtubeLikeCount?: number
  tags?: string[]

  // Vibechat-specific metadata
  vibechatLikeCount?: number
  listenedCount?: number

  // Fields from the old schema that might still appear
  // in some contexts until the migration is fully complete.
  // Should be treated as deprecated.
  id?: number
  s3_audio_url?: string | null
  audioUrl?: string | null
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
    userid: string
    avatarUrl: string | null
  }
  searchedAt: string
}