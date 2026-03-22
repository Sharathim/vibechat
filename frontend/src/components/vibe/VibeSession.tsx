import { useState } from 'react'
import {
  Mic, MicOff, SkipBack, SkipForward,
  Play, Pause, RotateCcw, RotateCw, X
} from 'lucide-react'
import { useVibe } from '../../context/VibeContext'
import VibeQueue from './VibeQueue'
import type { VibeQueueItem } from '../../types/vibe'
import type { Song } from '../../types/song'
import { mockSongs } from '../../data/mockData'
import { formatTime } from '../../lib/utils'

export default function VibeSession() {
  const {
    session, endSession, minimize,
    addSong, removeSong,
  } = useVibe()

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isMicOn, setIsMicOn] = useState(false)
  const [showAddSongs, setShowAddSongs] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  if (!session) return null

  const currentSong: Song = (session.currentSong as Song) || mockSongs[0]
  const elapsed = (progress / 100) * currentSong.duration
  const remaining = currentSong.duration - elapsed

  const handleAddSong = (song: VibeQueueItem) => {
    addSong(song)
    setShowAddSongs(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 300,
      background: 'linear-gradient(180deg, #1a0a2e 0%, #0d0d12 100%)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Blurred bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${currentSong.thumbnailUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(40px)', opacity: 0.1,
        transform: 'scale(1.1)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        height: '100%',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 8px',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.6)',
              marginBottom: 2,
            }}>
              {session.isCoHost ? '⚡ Co-Host Mode' : '🎵 You are host'}
            </div>
            <div style={{
              fontSize: 16, fontWeight: 700, color: 'white',
              fontFamily: 'Syne, sans-serif',
            }}>
              Vibing with {session.partnerName}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Mic toggle */}
            <button
              onClick={() => setIsMicOn(m => !m)}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: isMicOn
                  ? 'var(--brand-primary)'
                  : 'rgba(255,255,255,0.15)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white',
                transition: 'background 0.2s',
              }}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            {/* Minimize */}
            <button
              onClick={minimize}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white',
                fontSize: 18,
              }}
            >
              ↓
            </button>

            {/* End vibe */}
            <button
              onClick={() => setShowEndConfirm(true)}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Now playing — top half */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '12px 24px 16px',
          flexShrink: 0,
        }}>
          {/* Album art */}
          <div style={{
            width: 160, height: 160,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(124,58,237,0.4)',
            marginBottom: 16,
          }}>
            <img
              src={currentSong.thumbnailUrl}
              alt={currentSong.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.parentElement!.style.background =
                  'linear-gradient(135deg, var(--brand-subtle), var(--brand-border))'
              }}
            />
          </div>

          {/* Song info */}
          <div style={{
            fontSize: 18, fontWeight: 700, color: 'white',
            fontFamily: 'Syne, sans-serif', marginBottom: 4,
            textAlign: 'center',
            whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis', maxWidth: '100%',
          }}>
            {currentSong.title}
          </div>
          <div style={{
            fontSize: 13, color: 'rgba(255,255,255,0.6)',
            marginBottom: 16,
          }}>
            {currentSong.artist}
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', marginBottom: 6 }}>
            <div
              style={{
                width: '100%', height: 3,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 2, cursor: 'pointer',
              }}
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = ((e.clientX - rect.left) / rect.width) * 100
                setProgress(Math.max(0, Math.min(100, pct)))
              }}
            >
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'white',
                borderRadius: 2,
                transition: 'width 0.5s linear',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 4,
            }}>
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Space Mono, monospace',
              }}>
                {formatTime(elapsed)}
              </span>
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Space Mono, monospace',
              }}>
                -{formatTime(remaining)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%', maxWidth: 280,
          }}>
            <button
              onClick={() => setProgress(p => Math.max(0, p - 5))}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                display: 'flex',
              }}
            >
              <RotateCcw size={22} />
            </button>
            <button style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: 'white', display: 'flex',
            }}>
              <SkipBack size={28} fill="white" />
            </button>
            <button
              onClick={() => setIsPlaying(p => !p)}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--brand-primary)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white',
                boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e =>
                e.currentTarget.style.transform = 'scale(1.05)'
              }
              onMouseLeave={e =>
                e.currentTarget.style.transform = 'scale(1)'
              }
            >
              {isPlaying
                ? <Pause size={24} fill="white" />
                : <Play size={24} fill="white" />
              }
            </button>
            <button style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: 'white', display: 'flex',
            }}>
              <SkipForward size={28} fill="white" />
            </button>
            <button
              onClick={() => setProgress(p => Math.min(100, p + 5))}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                display: 'flex',
              }}
            >
              <RotateCw size={22} />
            </button>
          </div>
        </div>

        {/* Queue — bottom half */}
        <div style={{
          flex: 1,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <VibeQueue
            queue={session.queue as VibeQueueItem[]}
            currentSongId={currentSong.id}
            onRemove={removeSong}
            onAddSongs={() => setShowAddSongs(true)}
          />
        </div>
      </div>

      {/* Add Songs sheet */}
      {showAddSongs && (
        <>
          <div
            onClick={() => setShowAddSongs(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 10,
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            background: 'var(--bg-elevated)',
            borderRadius: '28px 28px 0 0',
            padding: '0 20px 32px',
            zIndex: 11,
            animation: 'sheetUp 0.3s ease',
          }}>
            <div style={{
              width: 36, height: 4,
              background: 'var(--border-color)',
              borderRadius: 2,
              margin: '12px auto 20px',
            }} />
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18, fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 20, textAlign: 'center',
            }}>
              Add to Vibe
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { icon: '📚', label: 'Select from Library' },
                { icon: '🔍', label: 'Search Song' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  onClick={() => {
                    const song = mockSongs[
                      Math.floor(Math.random() * mockSongs.length)
                    ]
                    handleAddSong({
                      ...song,
                      addedBy: 'You',
                      position: session.queue.length,
                    })
                  }}
                  style={{
                    flex: 1, padding: '20px 16px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 16, cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e =>
                    e.currentTarget.style.background = 'var(--brand-subtle)'
                  }
                  onMouseLeave={e =>
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                  }
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* End vibe confirmation */}
      {showEndConfirm && (
        <>
          <div
            onClick={() => setShowEndConfirm(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 10,
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--bg-elevated)',
            borderRadius: 20, padding: 24,
            width: 'min(300px, 90vw)',
            zIndex: 11,
            textAlign: 'center',
            animation: 'scaleIn 0.2s ease',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18, fontWeight: 700,
              marginBottom: 8, color: 'var(--text-primary)',
            }}>
              End Vibe?
            </h3>
            <p style={{
              fontSize: 14, color: 'var(--text-secondary)',
              marginBottom: 20,
            }}>
              {session.partnerName} will be notified.
              A Vibe Recap will be saved in chat.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="btn btn-ghost"
                style={{ flex: 1, height: 44, fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={endSession}
                className="btn btn-danger"
                style={{ flex: 1, height: 44, fontSize: 14 }}
              >
                End Vibe
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}