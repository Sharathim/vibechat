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
import musicApi from '../api/music'

const mapSong = (song: any): Song => ({
  id: song.id, // This might be null for YT results
  youtubeId: song.youtube_id,
  title: song.title,
  artist: song.artist,
  thumbnailUrl: song.thumbnail_url || '',
  duration: song.duration || 0,
  vibechatLikeCount: song.vibechat_like_count || 0,
  listenedCount: song.listened_count || 0,
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

interface HistoryItem {
  id: number
  type: 'song' | 'user'
  reference_id: string
  song?: Song
  user?: Pick<User, 'id' | 'name' | 'userid' | 'avatarUrl'>
}

export default function SearchPage() {
  const { play } = useMusic()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<SearchMode>('song')
  const [songResults, setSongResults] = useState<Song[]>([])
  const [userResults, setUserResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set())
  const [followStatuses, setFollowStatuses] = useState<Record<number, 'none' | 'pending' | 'following'>>({})
  const [history, setHistory] = useState<HistoryItem[]>([])

  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await searchApi.getHistory(mode)
        setHistory(res.data.history || [])
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
      setSearchError(null)
      return
    }

    setIsSearching(true)
    setSearchError(null)

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
      } catch (err: any) {
        console.error('Search error:', err)
        setSearchError(err.response?.data?.message || 'Search failed. Please try again.')
        setSongResults([])
        setUserResults([])
      } finally {
        setIsSearching(false)
      }
    }

    doSearch()
  }, [debouncedQuery, mode])

  const handlePlayAndUpsert = async (song: Song) => {
    // Upsert song metadata on selection
    try {
      await musicApi.upsertSong(song.youtubeId)
    } catch (err) {
      console.warn('Failed to upsert song metadata:', err)
    }
    play(song)
  }

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode)
    setQuery('')
    setSongResults([])
    setUserResults([])
    setSearchError(null)
  }

  const handleClear = () => {
    setQuery('')
    setSongResults([])
    setUserResults([])
    setSearchError(null)
  }

  const handleHistorySelect = (item: HistoryItem) => {
    if (item.type === 'song' && item.song) {
      handlePlayAndUpsert(item.song)
    }
  }

  const handleHistoryRemove = async (id: number) => {
    try {
      await searchApi.removeHistoryItem(id)
    } catch { /* UX is responsive */ }
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const handleHistoryClearAll = async () => {
    try {
      await searchApi.clearHistory(mode)
    } catch { /* UX is responsive */ }
    setHistory(prev => prev.filter(h => h.type !== mode))
  }

  const handleLike = async (youtubeId: string) => {
    const isCurrentlyLiked = likedSongs.has(youtubeId)
    setLikedSongs(prev => {
      const next = new Set(prev)
      if (isCurrentlyLiked) next.delete(youtubeId)
      else next.add(youtubeId)
      return next
    })

    try {
      if (isCurrentlyLiked) {
        await musicApi.unlikeSong(youtubeId)
      } else {
        await musicApi.likeSong(youtubeId)
      }
    } catch {
      // Revert on error
      setLikedSongs(prev => {
        const next = new Set(prev)
        if (isCurrentlyLiked) next.add(youtubeId)
        else next.delete(youtubeId)
        return next
      })
    }
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
        {isSearching && (
          <div style={{ padding: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {searchError && !isSearching && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--error)' }}>
              Search Failed
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {searchError}
            </p>
          </div>
        )}

        {!isSearching && !searchError && query && !hasResults && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>
              {mode === 'song' ? '🎵' : '👤'}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              No results found
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Try a different {mode === 'song' ? 'song or artist' : 'query'}
            </p>
          </div>
        )}

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

        {!isSearching && mode === 'song' && songResults.map(song => (
          <SongResult
            key={song.youtubeId}
            song={song}
            isLiked={likedSongs.has(song.youtubeId)}
            onLike={() => handleLike(song.youtubeId)}
            onPlay={() => handlePlayAndUpsert(song)}
          />
        ))}

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