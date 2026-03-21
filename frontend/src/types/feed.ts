import type { Song } from './song'

export interface FeedItem {
  id: number
  song: Song
  likeCount: number
  activityType: 'like' | 'vibe' | 'both'
  timestamp: string
  isLiked: boolean
}

export interface SongClip {
  id: number
  userId: number
  username: string
  avatarUrl: string | null
  song: Song
  startSeconds: number
  expiresAt: string
  isViewed: boolean
}