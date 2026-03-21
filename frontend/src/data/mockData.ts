import type { User, Notification } from '../types/user'
import type { Song, Playlist, HistoryItem } from '../types/song'
import type { Conversation, Message } from '../types/chat'
import type { FeedItem, SongClip } from '../types/feed'

export const mockCurrentUser: User = {
  id: 1,
  username: 'sharathi_zen',
  name: 'Sharathi',
  email: 'sharathi@gmail.com',
  avatarUrl: null,
  rankBadge: 1,
  bio: 'Music enthusiast | Late night listener | Sharing vibes',
  isPrivate: true,
  followers: 1240,
  following: 380,
  vibes: 47,
}

export const mockUsers: User[] = [
  {
    id: 2,
    username: 'maya_vibes',
    name: 'Maya',
    email: 'maya@gmail.com',
    avatarUrl: 'https://picsum.photos/seed/maya/100/100',
    rankBadge: 2,
    bio: 'Music is life 🎵',
    isPrivate: false,
    followers: 890,
    following: 234,
    vibes: 23,
  },
  {
    id: 3,
    username: 'alex_music',
    name: 'Alex Thompson',
    email: 'alex@gmail.com',
    avatarUrl: 'https://picsum.photos/seed/alex/100/100',
    rankBadge: 3,
    bio: 'Always vibing',
    isPrivate: true,
    followers: 456,
    following: 123,
    vibes: 12,
  },
  {
    id: 4,
    username: 'jordan_beats',
    name: 'Jordan Lee',
    email: 'jordan@gmail.com',
    avatarUrl: 'https://picsum.photos/seed/jordan/100/100',
    rankBadge: 4,
    bio: 'Producer | Music lover',
    isPrivate: false,
    followers: 2100,
    following: 540,
    vibes: 89,
  },
  {
    id: 5,
    username: 'riley_m',
    name: 'Riley Mitchell',
    email: 'riley@gmail.com',
    avatarUrl: 'https://picsum.photos/seed/riley/100/100',
    rankBadge: 5,
    bio: '',
    isPrivate: false,
    followers: 340,
    following: 89,
    vibes: 5,
  },
]

export const mockSongs: Song[] = [
  {
    id: 1,
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnailUrl: 'https://picsum.photos/seed/blindinglights/300/300',
    audioUrl: null,
    duration: 200,
  },
  {
    id: 2,
    youtubeId: 'xpVfcZ0ZcFM',
    title: 'Starboy',
    artist: 'The Weeknd',
    thumbnailUrl: 'https://picsum.photos/seed/starboy/300/300',
    audioUrl: null,
    duration: 230,
  },
  {
    id: 3,
    youtubeId: 'LIIDh-qI9oI',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    thumbnailUrl: 'https://picsum.photos/seed/saveyourtears/300/300',
    audioUrl: null,
    duration: 215,
  },
  {
    id: 4,
    youtubeId: 'X32Xb50ZVUA',
    title: 'Die For You',
    artist: 'The Weeknd',
    thumbnailUrl: 'https://picsum.photos/seed/dieforyou/300/300',
    audioUrl: null,
    duration: 260,
  },
  {
    id: 5,
    youtubeId: 'ygTZZpVkmKg',
    title: 'Heartless',
    artist: 'The Weeknd',
    thumbnailUrl: 'https://picsum.photos/seed/heartless/300/300',
    audioUrl: null,
    duration: 198,
  },
  {
    id: 6,
    youtubeId: 'abiAp8rIHSs',
    title: 'After Hours',
    artist: 'The Weeknd',
    thumbnailUrl: 'https://picsum.photos/seed/afterhours/300/300',
    audioUrl: null,
    duration: 361,
  },
]

export const mockConversations: Conversation[] = [
  {
    id: 1,
    user: mockUsers[0],
    lastMessage: 'That song you shared was fire!',
    lastMessageType: 'text',
    lastMessageAt: '2m',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 2,
    user: mockUsers[1],
    lastMessage: 'Blinding Lights',
    lastMessageType: 'song',
    lastMessageAt: '15m',
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: 3,
    user: mockUsers[2],
    lastMessage: "Let's create a playlist together",
    lastMessageType: 'text',
    lastMessageAt: '1h',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 4,
    user: mockUsers[3],
    lastMessage: 'Did you see the new album dropped?',
    lastMessageType: 'text',
    lastMessageAt: '3h',
    unreadCount: 0,
    isOnline: false,
  },
]

export const mockMessages: Message[] = [
  {
    id: 1,
    conversationId: 1,
    senderId: 2,
    type: 'text',
    content: 'Hey! Have you listened to the new Weeknd album?',
    isRead: true,
    createdAt: '10:30 AM',
  },
  {
    id: 2,
    conversationId: 1,
    senderId: 1,
    type: 'text',
    content: 'Yes! Blinding Lights is insane 🔥',
    isRead: true,
    createdAt: '10:31 AM',
  },
  {
    id: 3,
    conversationId: 1,
    senderId: 2,
    type: 'song',
    content: '',
    song: mockSongs[0],
    isRead: true,
    createdAt: '10:32 AM',
  },
  {
    id: 4,
    conversationId: 1,
    senderId: 1,
    type: 'text',
    content: 'That song you shared was fire!',
    isRead: false,
    createdAt: '10:33 AM',
  },
]

export const mockFeedItems: FeedItem[] = [
  {
    id: 1,
    song: mockSongs[0],
    likeCount: 3,
    activityType: 'like',
    timestamp: '2h ago',
    isLiked: false,
  },
  {
    id: 2,
    song: mockSongs[1],
    likeCount: 7,
    activityType: 'vibe',
    timestamp: '5h ago',
    isLiked: true,
  },
  {
    id: 3,
    song: mockSongs[2],
    likeCount: 1,
    activityType: 'both',
    timestamp: 'Yesterday',
    isLiked: false,
  },
  {
    id: 4,
    song: mockSongs[3],
    likeCount: 12,
    activityType: 'like',
    timestamp: '2 days ago',
    isLiked: false,
  },
]

export const mockClips: SongClip[] = [
  {
    id: 1,
    userId: 2,
    username: 'maya_vibes',
    avatarUrl: mockUsers[0].avatarUrl,
    song: mockSongs[0],
    startSeconds: 45,
    expiresAt: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
    isViewed: false,
  },
  {
    id: 2,
    userId: 3,
    username: 'alex_music',
    avatarUrl: mockUsers[1].avatarUrl,
    song: mockSongs[2],
    startSeconds: 60,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    isViewed: true,
  },
  {
    id: 3,
    userId: 4,
    username: 'jordan_beats',
    avatarUrl: mockUsers[2].avatarUrl,
    song: mockSongs[4],
    startSeconds: 30,
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    isViewed: false,
  },
]

export const mockPlaylists: Playlist[] = [
  {
    id: 1,
    name: 'Late Night Vibes',
    coverUrl: null,
    songCount: 12,
    isShared: false,
    sharedWith: null,
    createdAt: '2026-03-01',
  },
  {
    id: 2,
    name: 'Workout Mix',
    coverUrl: null,
    songCount: 8,
    isShared: false,
    sharedWith: null,
    createdAt: '2026-03-10',
  },
  {
    id: 3,
    name: 'Our Playlist',
    coverUrl: null,
    songCount: 5,
    isShared: true,
    sharedWith: 'Maya',
    createdAt: '2026-03-15',
  },
]

export const mockHistory: HistoryItem[] = [
  { id: 1, song: mockSongs[0], playedAt: 'Just now' },
  { id: 2, song: mockSongs[2], playedAt: '2h ago' },
  { id: 3, song: mockSongs[1], playedAt: '5h ago' },
  { id: 4, song: mockSongs[4], playedAt: 'Yesterday' },
  { id: 5, song: mockSongs[3], playedAt: '2 days ago' },
]

export const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'follow_request',
    fromUser: { id: 3, name: 'Alex Thompson', username: 'alex_music', avatarUrl: null },
    message: 'wants to follow you',
    isRead: false,
    createdAt: '5m ago',
  },
  {
    id: 2,
    type: 'message',
    fromUser: { id: 2, name: 'Maya', username: 'maya_vibes', avatarUrl: null },
    message: 'sent you a message',
    isRead: false,
    createdAt: '15m ago',
  },
  {
    id: 3,
    type: 'vibe_request',
    fromUser: { id: 4, name: 'Jordan Lee', username: 'jordan_beats', avatarUrl: null },
    message: 'wants to vibe with you',
    isRead: true,
    createdAt: '1h ago',
  },
]

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getInitial(name: string): string {
  return name ? name[0].toUpperCase() : '?'
}

export function getAvatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg, #7C3AED, #A855F7)',
    'linear-gradient(135deg, #06B6D4, #0891B2)',
    'linear-gradient(135deg, #10B981, #059669)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #EF4444, #DC2626)',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}