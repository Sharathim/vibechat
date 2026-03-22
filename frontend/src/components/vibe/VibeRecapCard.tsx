import { Play, Music } from 'lucide-react'
import type { VibeRecap } from '../../types/chat'

interface VibeRecapCardProps {
  recap: VibeRecap
  isOwn: boolean
  onRevibe: () => void
  onViewSongs: () => void
}

export default function VibeRecapCard({
  recap,
  isOwn,
  onRevibe,
  onViewSongs,
}: VibeRecapCardProps) {
  const durationMins = Math.round(recap.duration / 60)
  const previewSongs = recap.songs.slice(0, 4)

  return (
    <div style={{
      alignSelf: isOwn ? 'flex-end' : 'flex-start',
      maxWidth: 300,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-color)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Album art collage */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        height: 120,
        background: 'var(--bg-tertiary)',
      }}>
        {previewSongs.length > 0 ? (
          previewSongs.map((song, i) => (
            <div key={i} style={{ overflow: 'hidden' }}>
              <img
                src={song.thumbnailUrl}
                alt={song.title}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', display: 'block',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.parentElement!.style.background =
                    'linear-gradient(135deg, var(--brand-subtle), var(--brand-border))'
                }}
              />
            </div>
          ))
        ) : (
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Music size={40} style={{ color: 'var(--border-color)' }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 14 }}>🎧</span>
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: 'Syne, sans-serif',
          }}>
            Vibe Recap
          </span>
        </div>
        <p style={{
          fontSize: 12, color: 'var(--text-secondary)',
          marginBottom: 8,
        }}>
          {recap.participants.join(' & ')} · {durationMins} mins
        </p>
        <p style={{
          fontSize: 12, color: 'var(--text-muted)',
          marginBottom: 12,
        }}>
          {recap.songs.length} songs played
        </p>
      </div>

      {/* Divider */}
      <div style={{
        height: 1, background: 'var(--border-subtle)',
        margin: '0 14px',
      }} />

      {/* Actions */}
      <div style={{
        display: 'flex',
        borderTop: 'none',
      }}>
        <button
          onClick={onRevibe}
          style={{
            flex: 1, padding: '12px 0',
            background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--brand-primary)',
            fontSize: 13, fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--brand-subtle)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'none'
          }
        >
          <Play size={14} />
          Revibe
        </button>
        <div style={{ width: 1, background: 'var(--border-subtle)' }} />
        <button
          onClick={onViewSongs}
          style={{
            flex: 1, padding: '12px 0',
            background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontSize: 13, fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--bg-tertiary)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'none'
          }
        >
          View Songs
        </button>
      </div>
    </div>
  )
}