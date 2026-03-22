import { Plus, X, GripVertical } from 'lucide-react'
import type { VibeQueueItem } from '../../types/vibe'
import { formatDuration } from '../../data/mockData'

interface VibeQueueProps {
  queue: VibeQueueItem[]
  currentSongId?: number
  onRemove: (songId: number) => void
  onAddSongs: () => void
}

export default function VibeQueue({
  queue,
  currentSongId,
  onRemove,
  onAddSongs,
}: VibeQueueProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 8px',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'white',
          fontFamily: 'Syne, sans-serif',
        }}>
          Queue ({queue.length})
        </span>
        <button
          onClick={onAddSongs}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: 20,
            padding: '6px 12px', cursor: 'pointer',
            color: 'white', fontSize: 13, fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'rgba(255,255,255,0.25)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
          }
        >
          <Plus size={14} />
          Add Songs
        </button>
      </div>

      {/* Queue list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {queue.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 24px', textAlign: 'center', gap: 12,
          }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              No songs in queue
            </p>
            <button
              onClick={onAddSongs}
              style={{
                background: 'var(--brand-primary)',
                border: 'none', borderRadius: 20,
                padding: '8px 20px', cursor: 'pointer',
                color: 'white', fontSize: 13, fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              + Add Songs
            </button>
          </div>
        ) : (
          queue.map((song, index) => {
            const isCurrent = song.id === currentSongId
            return (
              <div
                key={song.id}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: 10, padding: '8px 16px',
                  background: isCurrent
                    ? 'rgba(124,58,237,0.3)'
                    : 'transparent',
                  borderLeft: isCurrent
                    ? '3px solid var(--brand-primary)'
                    : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                {/* Position number */}
                <span style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.4)',
                  width: 20, textAlign: 'center', flexShrink: 0,
                }}>
                  {isCurrent ? '▶' : index + 1}
                </span>

                {/* Album art */}
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 8, overflow: 'hidden',
                  flexShrink: 0, background: 'rgba(255,255,255,0.1)',
                }}>
                  <img
                    src={song.thumbnailUrl}
                    alt={song.title}
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
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: isCurrent ? 'white' : 'rgba(255,255,255,0.9)',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', marginBottom: 2,
                  }}>
                    {song.title}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                    {song.artist} · {formatDuration(song.duration)}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onRemove(song.id)}
                  style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                    display: 'flex', padding: 4, flexShrink: 0,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e =>
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                  }
                  onMouseLeave={e =>
                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
                  }
                >
                  <X size={16} />
                </button>

                {/* Drag handle */}
                <div style={{
                  color: 'rgba(255,255,255,0.2)',
                  cursor: 'grab', flexShrink: 0,
                }}>
                  <GripVertical size={16} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}