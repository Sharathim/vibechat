import { Play, Plus, X } from 'lucide-react'
import type { VibeRecap } from '../../types/chat'
import { formatDuration } from '../../data/mockData'
import { useMusic } from '../../context/MusicContext'

interface VibeRecapExpandedProps {
  recap: VibeRecap
  onClose: () => void
  onRevibe: () => void
}

export default function VibeRecapExpanded({
  recap,
  onClose,
  onRevibe,
}: VibeRecapExpandedProps) {
  const { play } = useMusic()
  const durationMins = Math.round(recap.duration / 60)

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--overlay)', zIndex: 200,
        }}
      />
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--bg-elevated)',
        borderRadius: '28px 28px 0 0',
        zIndex: 201,
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        animation: 'sheetUp 0.35s ease',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4,
          background: 'var(--border-color)',
          borderRadius: 2,
          margin: '12px auto 0',
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 4,
            }}>
              <span style={{ fontSize: 16 }}>🎧</span>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 17, fontWeight: 700,
                color: 'var(--text-primary)',
              }}>
                Vibe Recap
              </h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {recap.participants.join(' & ')} · {durationMins} mins · {recap.songs.length} songs
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Song list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {recap.songs.map((song, index) => (
            <div
              key={song.id}
              style={{
                display: 'flex', alignItems: 'center',
                gap: 12, padding: '10px 20px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e =>
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }
              onMouseLeave={e =>
                e.currentTarget.style.background = 'transparent'
              }
            >
              <span style={{
                width: 24, fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center', flexShrink: 0,
              }}>
                {index + 1}
              </span>
              <div style={{
                width: 48, height: 48,
                borderRadius: 8, overflow: 'hidden',
                flexShrink: 0, background: 'var(--bg-tertiary)',
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
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', marginBottom: 2,
                }}>
                  {song.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {song.artist} · {formatDuration(song.duration)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => play({
                    id: song.id,
                    youtubeId: (song as any).youtube_id || song.youtubeId || '',
                    title: song.title,
                    artist: song.artist,
                    thumbnailUrl: (song as any).thumbnail_url || song.thumbnailUrl || '',
                    audioUrl: (song as any).s3_audio_url || song.audioUrl || null,
                    duration: song.duration,
                  })}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--brand-primary)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white',
                  }}
                >
                  <Play size={14} fill="white" />
                </button>
                <button style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{
          display: 'flex', gap: 10,
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <button
            onClick={onRevibe}
            className="btn btn-primary"
            style={{ flex: 1, height: 48, fontSize: 14, gap: 6 }}
          >
            <Play size={16} />
            Revibe
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, height: 48, fontSize: 14 }}
          >
            Save All
          </button>
        </div>
      </div>
    </>
  )
}