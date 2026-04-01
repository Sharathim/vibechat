import { useEffect, useMemo, useState } from 'react'
import {
  Heart, Download, ListMusic, Users,
  Shuffle, ChevronRight, X, Music
} from 'lucide-react'
import SongRow from '../components/music/SongRow'
import PlaylistCard from '../components/music/PlaylistCard'
import type { Song, Playlist, HistoryItem } from '../types/song'
import { useMusic } from '../context/MusicContext'
import Avatar from '../components/common/Avatar'
import musicApi from '../api/music'
import usersApi from '../api/users'
import { useAuth } from '../context/AuthContext'

type Section = 'main' | 'liked' | 'downloads' | 'playlists' | 'shared'

type ProfileChip = {
  name: string
  userid: string
  avatarUrl: string | null
  rankBadge: number
}

const mapSong = (song: any): Song => ({
  id: song.id,
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

const mapPlaylist = (playlist: any): Playlist => ({
  id: playlist.id,
  name: playlist.name,
  coverUrl: playlist.cover_url || null,
  songCount: playlist.song_count || 0,
  isShared: Boolean(playlist.is_shared),
  sharedWith: playlist.shared_with_name || null,
  createdAt: playlist.created_at || '',
})

const mapHistoryItem = (row: any): HistoryItem => ({
  id: row.history_id || row.id,
  song: mapSong(row),
  playedAt: row.played_at || '',
})

export default function MusicPage() {
  const { play } = useMusic()
  const { user: authUser } = useAuth()

  const [section, setSection] = useState<Section>('main')
  const [likedSongs, setLikedSongs] = useState<Song[]>([])
  const [downloads, setDownloads] = useState<Song[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [sharedPlaylists, setSharedPlaylists] = useState<Playlist[]>([])
  const [showDownloadWarning, setShowDownloadWarning] = useState(true)
  const [profileChip, setProfileChip] = useState<ProfileChip>({
    name: authUser?.name || 'You',
    userid: authUser?.userid || 'you',
    avatarUrl: authUser?.avatarUrl || null,
    rankBadge: authUser?.rankBadge || 0,
  })

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const [likedRes, downloadsRes, historyRes, playlistsRes, sharedRes, profileRes] = await Promise.all([
          musicApi.getLiked(),
          musicApi.getDownloads(),
          musicApi.getHistory(),
          musicApi.getPlaylists(),
          musicApi.getSharedPlaylists(),
          usersApi.getMyProfile(),
        ])

        setLikedSongs((likedRes.data.songs || []).map(mapSong))
        setDownloads((downloadsRes.data.songs || []).map(mapSong))
        setHistory((historyRes.data.history || []).map(mapHistoryItem))
        setPlaylists((playlistsRes.data.playlists || []).map(mapPlaylist))
        setSharedPlaylists((sharedRes.data.playlists || []).map(mapPlaylist))

        const p = profileRes.data.user || {}
        setProfileChip({
          name: p.name || authUser?.name || 'You',
          userid: p.userid || authUser?.userid || 'you',
          avatarUrl: p.avatar_url || authUser?.avatarUrl || null,
          rankBadge: p.rank_badge || authUser?.rankBadge || 0,
        })
      } catch {
        setLikedSongs([])
        setDownloads([])
        setHistory([])
        setPlaylists([])
        setSharedPlaylists([])
      }
    }

    fetchLibrary()
  }, [authUser])

  const likedSet = useMemo(() => new Set(likedSongs.map(s => s.id)), [likedSongs])

  const toggleLike = async (songId: number) => {
    const isLiked = likedSet.has(songId)
    const targetSong = likedSongs.find(s => s.id === songId)

    if (isLiked) {
      setLikedSongs(prev => prev.filter(song => song.id !== songId))
      try {
        await musicApi.unlikeSong(songId)
      } catch {
        if (targetSong) setLikedSongs(prev => [...prev, targetSong])
      }
      return
    }

    if (!targetSong) return

    setLikedSongs(prev => [...prev, targetSong])
    try {
      await musicApi.likeSong(songId)
    } catch {
      setLikedSongs(prev => prev.filter(song => song.id !== songId))
    }
  }

  const removeFromHistory = async (id: number) => {
    const previous = history
    setHistory(prev => prev.filter(h => h.id !== id))
    try {
      await musicApi.deleteHistoryItem(id)
    } catch {
      setHistory(previous)
    }
  }

  const clearHistory = async () => {
    const previous = history
    setHistory([])
    try {
      await musicApi.clearHistory()
    } catch {
      setHistory(previous)
    }
  }

  const shuffleAll = () => {
    const allSongs = [...likedSongs, ...downloads]
    if (allSongs.length === 0) return
    const randomIndex = Math.floor(Math.random() * allSongs.length)
    const song = allSongs[randomIndex]
    play({
      id: song.id,
      youtubeId: song.youtube_id || song.youtubeId || '',
      title: song.title,
      artist: song.artist,
      thumbnailUrl: song.thumbnail_url || song.thumbnailUrl || '',
      audioUrl: song.s3_audio_url || song.audioUrl || null,
      duration: song.duration,
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
      count: playlists.length,
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
        {'<-'}
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
                onLike={() => void toggleLike(song.id)}
              />
            ))
          )}
        </div>
      </div>
    )
  }

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
              <span style={{ fontSize: 16, flexShrink: 0 }}>i</span>
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
              {'<-'}
            </button>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18, fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              My Playlists
            </h2>
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {playlists.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '60px 24px', textAlign: 'center',
            }}>
              <Music size={48} style={{ color: 'var(--border-color)', marginBottom: 16 }} />
              <h3 style={{ marginBottom: 8 }}>No playlists yet</h3>
            </div>
          ) : (
            playlists.map(p => (
              <PlaylistCard key={p.id} playlist={p} />
            ))
          )}
        </div>
      </div>
    )
  }

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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <Avatar
            name={profileChip.name}
            src={profileChip.avatarUrl}
            size={40}
            showRank={true}
            rankNumber={profileChip.rankBadge}
          />
          <div>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {profileChip.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              @{profileChip.userid}
            </div>
          </div>
        </div>

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
                onClick={() => void clearHistory()}
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
                  youtubeId: item.song.youtube_id || item.song.youtubeId || '',
                  title: item.song.title,
                  artist: item.song.artist,
                  thumbnailUrl: item.song.thumbnail_url || item.song.thumbnailUrl || '',
                  audioUrl: item.song.s3_audio_url || item.song.audioUrl || null,
                  duration: item.song.duration,
                })}
              >
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
                    {item.song.artist} {item.playedAt ? `· ${item.playedAt}` : ''}
                  </div>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation()
                    void removeFromHistory(item.id)
                  }}
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
