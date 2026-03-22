import { useState } from 'react'
import {
  Heart, Download, ListMusic, Users,
  Shuffle, ChevronRight, X, Music
} from 'lucide-react'
import SongRow from '../components/music/SongRow'
import PlaylistCard from '../components/music/PlaylistCard'
import {
  mockSongs, mockPlaylists, mockHistory,
  mockCurrentUser
} from '../data/mockData'
import type { Song } from '../types/song'
import type { HistoryItem } from '../types/song'
import { useMusic } from '../context/MusicContext'
import Avatar from '../components/common/Avatar'

type Section = 'main' | 'liked' | 'downloads' | 'playlists' | 'shared'

export default function MusicPage() {
  const { play } = useMusic()

  const [section, setSection] = useState<Section>('main')
  const [likedSongs, setLikedSongs] = useState<Song[]>(mockSongs.slice(0, 3))
  const [downloads] = useState<Song[]>(mockSongs.slice(1, 4))
  const [history, setHistory] = useState<HistoryItem[]>(mockHistory)
  const [likedSet, setLikedSet] = useState<Set<number>>(
    new Set(mockSongs.slice(0, 3).map(s => s.id))
  )
  const [showDownloadWarning, setShowDownloadWarning] = useState(true)

  const regularPlaylists = mockPlaylists.filter(p => !p.isShared)
  const sharedPlaylists = mockPlaylists.filter(p => p.isShared)

  const toggleLike = (songId: number) => {
    setLikedSet(prev => {
      const next = new Set(prev)
      if (next.has(songId)) {
        next.delete(songId)
        setLikedSongs(s => s.filter(song => song.id !== songId))
      } else {
        next.add(songId)
        const song = mockSongs.find(s => s.id === songId)
        if (song) setLikedSongs(s => [...s, song])
      }
      return next
    })
  }

  const removeFromHistory = (id: number) => {
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const clearHistory = () => setHistory([])

  const shuffleAll = () => {
    const allSongs = [...likedSongs, ...downloads]
    if (allSongs.length === 0) return
    const randomIndex = Math.floor(Math.random() * allSongs.length)
    play({
      id: allSongs[randomIndex].id,
      youtubeId: (allSongs[randomIndex] as any).youtube_id || allSongs[randomIndex].youtubeId || '',
      title: allSongs[randomIndex].title,
      artist: allSongs[randomIndex].artist,
      thumbnailUrl: (allSongs[randomIndex] as any).thumbnail_url || allSongs[randomIndex].thumbnailUrl || '',
      audioUrl: (allSongs[randomIndex] as any).s3_audio_url || allSongs[randomIndex].audioUrl || null,
      duration: allSongs[randomIndex].duration,
    })
  }

  const libraryItems = [
    {
      icon: Heart,
      label: 'Liked Songs',
      count: likedSongs.length,
      color: 'var(--error)',
      section: 'liked' as Section,
    },
    {
      icon: Download,
      label: 'Downloads',
      count: downloads.length,
      color: 'var(--accent)',
      section: 'downloads' as Section,
    },
    {
      icon: ListMusic,
      label: 'Playlists',
      count: regularPlaylists.length,
      color: 'var(--brand-primary)',
      section: 'playlists' as Section,
    },
    {
      icon: Users,
      label: 'Shared Playlists',
      count: sharedPlaylists.length,
      color: 'var(--success)',
      section: 'shared' as Section,
    },
  ]

  // Sub-section header
  const SubHeader = ({ title }: { title: string }) => (
    <header style={{
      height: 'var(--header-h)',
      background: 'var(--bg-elevated)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      flexShrink: 0,
    }}>
      <button
        onClick={() => setSection('main')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          display: 'flex',
          padding: 4,
        }}
      >
        ←
      </button>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--text-primary)',
      }}>
        {title}
      </h2>
    </header>
  )

  // Liked Songs section
  if (section === 'liked') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', background: 'var(--bg-primary)', overflow: 'hidden',
      }}>
        <SubHeader title={`Liked Songs (${likedSongs.length})`} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {likedSongs.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '60px 24px', textAlign: 'center',
            }}>
              <Heart size={48} style={{ color: 'var(--border-color)', marginBottom: 16 }} />
              <h3 style={{ marginBottom: 8 }}>No liked songs yet</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Like songs from search or your feed
              </p>
            </div>
          ) : (
            likedSongs.map(song => (
              <SongRow
                key={song.id}
                song={song}
                isLiked={likedSet.has(song.id)}
                onLike={() => toggleLike(song.id)}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  // Downloads section
  if (section === 'downloads') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', background: 'var(--bg-primary)', overflow: 'hidden',
      }}>
        <SubHeader title={`Downloads (${downloads.length})`} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {showDownloadWarning && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              margin: 16,
              padding: '12px 14px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
              <p style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                flex: 1,
                lineHeight: 1.5,
              }}>
                Downloaded songs are stored inside VibeChat.
                Clearing your browser or app data will remove them.
              </p>
              <button
                onClick={() => setShowDownloadWarning(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent)',
                  fontSize: 13,
                  fontWeight: 600,
                  flexShrink: 0,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Got it
              </button>
            </div>
          )}
          {downloads.map(song => (
            <SongRow key={song.id} song={song} />
          ))}
        </div>
      </div>
    )
  }

  // Playlists section
  if (section === 'playlists') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', background: 'var(--bg-primary)', overflow: 'hidden',
      }}>
        <header style={{
          height: 'var(--header-h)',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSection('main')}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text-secondary)',
                display: 'flex', padding: 4,
              }}
            >
              ←
            </button>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18, fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              My Playlists
            </h2>
          </div>
          <button style={{
            background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--brand-primary)',
            fontSize: 14, fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            + New
          </button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {regularPlaylists.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '60px 24px', textAlign: 'center',
            }}>
              <Music size={48} style={{ color: 'var(--border-color)', marginBottom: 16 }} />
              <h3 style={{ marginBottom: 8 }}>No playlists yet</h3>
              <button className="btn btn-primary" style={{ height: 40, fontSize: 14 }}>
                Create Playlist
              </button>
            </div>
          ) : (
            regularPlaylists.map(p => (
              <PlaylistCard key={p.id} playlist={p} />
            ))
          )}
        </div>
      </div>
    )
  }

  // Shared Playlists section
  if (section === 'shared') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', background: 'var(--bg-primary)', overflow: 'hidden',
      }}>
        <SubHeader title="Shared Playlists" />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sharedPlaylists.map(p => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </div>
      </div>
    )
  }

  // Main library screen
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
        height: 'var(--header-h)',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          My Library
        </h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* User chip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <Avatar
            name={mockCurrentUser.name}
            src={mockCurrentUser.avatarUrl}
            size={40}
            showRank={true}
            rankNumber={mockCurrentUser.rankBadge}
          />
          <div>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {mockCurrentUser.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              @{mockCurrentUser.username}
            </div>
          </div>
        </div>

        {/* Library options */}
        {libraryItems.map(({ icon: Icon, label, count, color, section: s }) => (
          <div
            key={label}
            onClick={() => setSection(s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border-subtle)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e =>
              e.currentTarget.style.background = 'var(--bg-tertiary)'
            }
            onMouseLeave={e =>
              e.currentTarget.style.background = 'transparent'
            }
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--brand-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={20} style={{ color }} />
            </div>
            <span style={{
              flex: 1,
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}>
              {label}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {count}
            </span>
            <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
        ))}

        {/* Shuffle All button */}
        <div style={{ padding: '20px 16px 8px' }}>
          <button
            onClick={shuffleAll}
            className="btn btn-primary btn-full"
            style={{
              gap: 8,
              borderRadius: 24,
            }}
          >
            <Shuffle size={18} />
            Shuffle All
          </button>
        </div>

        {/* History section */}
        <div style={{ padding: '16px 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px 8px',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              History
            </h3>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--error)',
                  fontFamily: 'DM Sans, sans-serif',
                  padding: 0,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}>
              No listening history yet
            </div>
          ) : (
            history.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e =>
                  e.currentTarget.style.background = 'var(--bg-tertiary)'
                }
                onMouseLeave={e =>
                  e.currentTarget.style.background = 'transparent'
                }
                onClick={() => play({
                  id: item.song.id,
                  youtubeId: (item.song as any).youtube_id || item.song.youtubeId || '',
                  title: item.song.title,
                  artist: item.song.artist,
                  thumbnailUrl: (item.song as any).thumbnail_url || item.song.thumbnailUrl || '',
                  audioUrl: (item.song as any).s3_audio_url || item.song.audioUrl || null,
                  duration: item.song.duration,
                })}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--bg-tertiary)',
                }}>
                  <img
                    src={item.song.thumbnailUrl}
                    alt={item.song.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.song.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {item.song.artist} · {item.playedAt}
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={e => { e.stopPropagation(); removeFromHistory(item.id) }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    padding: 4,
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}