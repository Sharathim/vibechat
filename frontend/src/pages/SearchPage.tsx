import { useState, useEffect } from 'react'
import SearchBar from '../components/search/SearchBar'
import SearchHistory from '../components/search/SearchHistory'
import SongResult from '../components/search/SongResult'
import UserResult from '../components/search/UserResult'
import type { Song } from '../types/song'
import type { User } from '../types/user'
import { useDebounce } from '../hooks/useDebounce'
import { useMusic } from '../context/MusicContext'
import searchApi from '../api/search'
import usersApi from '../api/users'

const toStableSongId = (raw: any): number => {
  if (typeof raw.id === 'number' && Number.isFinite(raw.id)) {
    return raw.id
  }

  const source = String(raw.youtube_id || raw.youtubeId || '')
  if (!source) return Date.now()

  let hash = 0
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash) + source.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash) || Date.now()
}

const mapSong = (song: any): Song => ({
  id: toStableSongId(song),
  youtubeId: song.youtube_id,
  youtube_id: song.youtube_id,
  title: song.title,
  artist: song.artist,
  thumbnailUrl: song.thumbnail_url || '',
  thumbnail_url: song.thumbnail_url || '',
  audioUrl: song.s3_audio_url || null,
  s3_audio_url: song.s3_audio_url || null,
  duration: song.duration || 0,
})

const mapUser = (u: any): User => ({
  id: u.id,
  userid: u.userid,
  name: u.name,
  email: u.email || '',
  avatarUrl: u.avatar_url || null,
  rankBadge: u.rank_badge || 0,
  bio: u.bio || '',
  isPrivate: Boolean(u.is_private),
  followers: u.followers_count || 0,
  following: u.following_count || 0,
  vibes: u.vibes_count || 0,
})

type SearchMode = 'song' | 'user'

interface SongHistoryItem {
  id: number
  type: 'song'
  song: Song
}

interface UserHistoryItem {
  id: number
  type: 'user'
  user: Pick<User, 'id' | 'name' | 'userid' | 'avatarUrl'>
}

type HistoryItem = SongHistoryItem | UserHistoryItem

export default function SearchPage() {
  const { play } = useMusic()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<SearchMode>('song')
  const [songResults, setSongResults] = useState<Song[]>([])
  const [userResults, setUserResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [likedSongs, setLikedSongs] = useState<Set<number>>(new Set())
  const [followStatuses, setFollowStatuses] = useState<Record<number, 'none' | 'pending' | 'following'>>({})
  const [history, setHistory] = useState<HistoryItem[]>([])

  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await searchApi.getHistory(mode)
        const items: HistoryItem[] = (res.data.history || []).map((row: any) => {
          if (row.type === 'song') {
            return {
              id: row.id,
              type: 'song',
              song: mapSong({
                id: row.song_id,
                youtube_id: row.youtube_id,
                title: row.title,
                artist: row.artist,
                thumbnail_url: row.thumbnail_url,
                duration: row.duration,
              }),
            }
          }

          return {
            id: row.id,
            type: 'user',
            user: {
              id: row.user_id,
              name: row.name,
              userid: row.userid,
              avatarUrl: row.avatar_url || null,
            },
          }
        })
        setHistory(items)
      } catch {
        setHistory([])
      }
    }

    loadHistory()
  }, [mode])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSongResults([])
      setUserResults([])
      return
    }

    setIsSearching(true)

    const doSearch = async () => {
      try {
        if (mode === 'song') {
          const res = await searchApi.searchSongs(debouncedQuery)
          setSongResults((res.data.songs || []).map(mapSong))
        } else {
          const res = await searchApi.searchUsers(debouncedQuery)
          const users = (res.data.users || []).map(mapUser)
          setUserResults(users)
          const statuses: Record<number, 'none' | 'pending' | 'following'> = {}
          for (const raw of res.data.users || []) {
            statuses[raw.id] = raw.is_following ? 'following' : raw.is_pending ? 'pending' : 'none'
          }
          setFollowStatuses(statuses)
        }
      } catch (err) {
        console.error('Search error:', err)
        setSongResults([])
        setUserResults([])
      } finally {
        setIsSearching(false)
      }
    }

    doSearch()
  }, [debouncedQuery, mode])

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode)
    setQuery('')
    setSongResults([])
    setUserResults([])
  }

  const handleClear = () => {
    setQuery('')
    setSongResults([])
    setUserResults([])
  }

  const handleHistorySelect = (item: HistoryItem) => {
    if (item.type === 'song') {
      const youtubeId = (item.song as any).youtube_id || item.song.youtubeId || ''
      const playSong = () => {
        play({
          id: item.song.id,
          youtubeId,
          title: item.song.title,
          artist: item.song.artist,
          thumbnailUrl: (item.song as any).thumbnail_url || item.song.thumbnailUrl || '',
          audioUrl: (item.song as any).s3_audio_url || item.song.audioUrl || null,
          duration: item.song.duration,
        })
      }

      if (!youtubeId) {
        playSong()
        return
      }

      searchApi.selectSong(youtubeId)
        .catch(() => {
          // Playback should continue even if metadata ingestion fails.
        })
        .finally(playSong)
    }
  }

  const handleHistoryRemove = async (id: number) => {
    try {
      await searchApi.removeHistoryItem(id)
    } catch {
      // Keep local UX responsive even if request fails
    }
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const handleHistoryClearAll = async () => {
    try {
      await searchApi.clearHistory(mode)
    } catch {
      // Keep local UX responsive even if request fails
    }
    setHistory(prev => prev.filter(h => h.type !== mode))
  }

  const handleLike = (songId: number) => {
    setLikedSongs(prev => {
      const next = new Set(prev)
      if (next.has(songId)) next.delete(songId)
      else next.add(songId)
      return next
    })
  }

  const handleFollow = async (userId: number) => {
    const current = followStatuses[userId] || 'none'
    const next = current === 'none' ? 'pending' : 'none'
    setFollowStatuses(prev => ({ ...prev, [userId]: next }))

    try {
      if (current === 'none') {
        await usersApi.followUser(userId)
      } else {
        await usersApi.unfollowUser(userId)
      }
    } catch {
      setFollowStatuses(prev => ({ ...prev, [userId]: current }))
    }
  }

  const hasResults = mode === 'song'
    ? songResults.length > 0
    : userResults.length > 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 16px 0',
        flexShrink: 0,
      }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 12,
        }}>
          Discover
        </h1>
        <div style={{ paddingBottom: 12 }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            mode={mode}
            onModeChange={handleModeChange}
            onClear={handleClear}
          />
        </div>
      </header>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {/* Loading skeleton */}
        {isSearching && (
          <div style={{ padding: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                }}
              >
                <div
                  className="skeleton"
                  style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    className="skeleton"
                    style={{ height: 14, width: '60%', marginBottom: 6 }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 12, width: '40%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!isSearching && query && !hasResults && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>
              {mode === 'song' ? '🎵' : '👤'}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              No results found
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Try a different {mode === 'song' ? 'song or artist' : 'userid'}
            </p>
          </div>
        )}

        {/* History (when no query) */}
        {!query && !isSearching && (
          <SearchHistory
            items={history}
            mode={mode}
            onSelect={handleHistorySelect}
            onRemove={handleHistoryRemove}
            onSeeAll={() => { }}
            onClearAll={handleHistoryClearAll}
          />
        )}

        {/* Song results */}
        {!isSearching && mode === 'song' && songResults.map(song => (
          <SongResult
            key={song.id}
            song={song}
            isLiked={likedSongs.has(song.id)}
            onLike={() => handleLike(song.id)}
          />
        ))}

        {/* User results */}
        {!isSearching && mode === 'user' && userResults.map(user => (
          <UserResult
            key={user.id}
            user={user}
            followStatus={followStatuses[user.id] || 'none'}
            onFollow={() => handleFollow(user.id)}
          />
        ))}
      </div>
    </div>
  )
}