import type { Song } from './song'

export interface VibeRequest {
  id: string
  fromUser: {
    id: number
    name: string
    username: string
    avatarUrl: string | null
  }
  isCoHost: boolean
  createdAt: string
}

export interface VibeQueueItem extends Song {
  addedBy: string
  position: number
}

export interface VibeSessionData {
  id: string
  partnerName: string
  partnerUsername: string
  partnerAvatar: string | null
  isCoHost: boolean
  isHost: boolean
  queue: VibeQueueItem[]
  currentSong: Song | null
  isPlaying: boolean
  progress: number
  startedAt: string
}