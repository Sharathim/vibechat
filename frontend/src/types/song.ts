import type { User } from './user'

export interface Song {
  id: number
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  audioUrl: string | null
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
  user?: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>
  searchedAt: string
}