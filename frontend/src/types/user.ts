export interface User {
  id: number
  username: string
  name: string
  email: string
  avatarUrl: string | null
  rankBadge: number
  bio: string
  isPrivate: boolean
  followers: number
  following: number
  vibes: number
}

export interface FollowStatus {
  isFollowing: boolean
  isPending: boolean
  isFollowedBy: boolean
}

export interface Notification {
  id: number
  type: 'follow_request' | 'new_follower' | 'message' | 'vibe_request' | 'shared_playlist'
  fromUser: {
    id: number
    name: string
    username: string
    avatarUrl: string | null
  }
  message: string
  isRead: boolean
  createdAt: string
}