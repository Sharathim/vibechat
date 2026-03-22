import { useState, useEffect } from 'react'
import SearchBar from '../components/search/SearchBar'
import SearchHistory from '../components/search/SearchHistory'
import SongResult from '../components/search/SongResult'
import UserResult from '../components/search/UserResult'
import { mockSongs, mockUsers } from '../data/mockData'
import type { Song } from '../types/song'
import type { User } from '../types/user'
import { useDebounce } from '../hooks/useDebounce'
import { useMusic } from '../context/MusicContext'
import searchApi from '../api/search'

type SearchMode = 'song' | 'user'

interface SongHistoryItem {
  id: number
  type: 'song'
  song: Song
}

interface UserHistoryItem {
  id: number
  type: 'user'
  user: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>
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
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 1, type: 'song', song: mockSongs[0] },
    { id: 2, type: 'song', song: mockSongs[2] },
    { id: 3, type: 'user', user: mockUsers[0] },
    { id: 4, type: 'user', user: mockUsers[1] },
  ])

  const debouncedQuery = useDebounce(query, 400)

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
          setSongResults(res.data.songs || [])
        } else {
          const res = await searchApi.searchUsers(debouncedQuery)
          setUserResults(res.data.users || [])
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
      play({
        id: item.song.id,
        title: item.song.title,
        artist: item.song.artist,
        thumbnailUrl: item.song.thumbnailUrl,
        audioUrl: item.song.audioUrl,
        duration: item.song.duration,
      })
    }
  }

  const handleHistoryRemove = (id: number) => {
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const handleHistoryClearAll = () => {
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

  const handleFollow = (userId: number) => {
    setFollowStatuses(prev => {
      const current = prev[userId] || 'none'
      return {
        ...prev,
        [userId]: current === 'none' ? 'pending' : 'none',
      }
    })
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
              Try a different {mode === 'song' ? 'song or artist' : 'username'}
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
            onSeeAll={() => {}}
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