import type { Song } from './song'
import type { User } from './user'

export interface VibeRecap {
  id: string
  participants: string[]
  songs: Song[]
  duration: number
  createdAt: string
}

export interface Message {
  id: number
  conversationId: number
  senderId: number
  type: 'text' | 'song' | 'image' | 'vibe_recap'
  content: string
  song?: Song
  vibeRecap?: VibeRecap
  isRead: boolean
  createdAt: string
}

export interface Conversation {
  id: number
  user: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>
  lastMessage: string
  lastMessageType: 'text' | 'song' | 'vibe_recap'
  lastMessageAt: string
  unreadCount: number
  isOnline: boolean
}