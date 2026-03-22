import { useNavigate } from 'react-router-dom'
import { Play, Pause, SkipForward } from 'lucide-react'
import { useMusic } from '../../context/MusicContext'
import { formatTime } from '../../lib/utils'

export default function MiniPlayer() {
  const navigate = useNavigate()
  const { currentSong, isPlaying, progress, pause, resume, skip } = useMusic()

  return (
    <div
      style={{
        height: 'var(--mini-player-h)',
        background: 'var(--player-bg)',
        borderTop: '1px solid var(--player-border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        flexShrink: 0,
        zIndex: 20,
        position: 'relative',
      }}
    >
      {currentSong ? (
        <>
          {/* Thumbnail */}
          <div
            onClick={() => navigate('/music/now-playing')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
              background: 'var(--bg-tertiary)',
            }}
          >
            <img
              src={currentSong.thumbnailUrl || undefined}
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
          <div
            onClick={() => navigate('/music/now-playing')}
            style={{
              flex: 1,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentSong.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentSong.artist}
            </div>
          </div>

          {/* Progress bar (desktop only) */}
          <div
            className="desktop-only"
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 32 }}>
              {formatTime((progress / 100) * currentSong.duration)}
            </span>
            <div
              style={{
                flex: 1,
                height: 3,
                background: 'var(--border-color)',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'var(--brand-primary)',
                  borderRadius: 2,
                  transition: 'width 0.5s linear',
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 32 }}>
              {formatTime(currentSong.duration)}
            </span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={isPlaying ? pause : resume}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--brand-primary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'transform 0.2s',
                flexShrink: 0,
              }}
            >
              {isPlaying
                ? <Pause size={18} fill="white" />
                : <Play size={18} fill="white" />
              }
            </button>
            <button
              onClick={skip}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              <SkipForward size={18} />
            </button>
          </div>
        </>
      ) : (
        /* Empty state */
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: 0.5,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: 'var(--bg-tertiary)',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              No song playing
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Search for a song to play
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              disabled
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'not-allowed',
                color: 'var(--text-muted)',
              }}
            >
              <Play size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
    </div>
  )
}