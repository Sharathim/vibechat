import { Heart, MoreVertical, X } from 'lucide-react'
import { useState } from 'react'
import type { Song } from '../../types/song'
import { formatDuration } from '../../data/mockData'
import { useMusic } from '../../context/MusicContext'
import { getThumbnailUrl } from '../../lib/thumbnail'

interface SongRowProps {
  song: Song
  isLiked?: boolean
  showRemove?: boolean
  isCurrentlyPlaying?: boolean
  onLike?: () => void
  onRemove?: () => void
  onOptionSelect?: (option: string) => void
}

export default function SongRow({
  song,
  isLiked = false,
  showRemove = false,
  isCurrentlyPlaying = false,
  onLike,
  onRemove,
  onOptionSelect,
}: SongRowProps) {
  const { play } = useMusic()
  const [showMenu, setShowMenu] = useState(false)

  const menuOptions = [
    '▶️ Play',
    '➕ Add to Queue',
    isLiked ? '❤️ Unlike' : '🤍 Like',
    '⬇️ Download',
    '📋 Add to Playlist',
    '🤝 Add to Shared Playlist',
    '↗️ Share to Chat',
    '✕ Remove from list',
  ]

  const handlePlay = () => {
    play({
      id: song.id,
      youtubeId: (song as any).youtube_id || song.youtubeId || '',
      title: song.title,
      artist: song.artist,
      thumbnailUrl: (song as any).thumbnail_url || song.thumbnailUrl || '',
      audioUrl: (song as any).s3_audio_url || song.audioUrl || null,
      duration: song.duration,
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderRadius: 12,
        background: isCurrentlyPlaying
          ? 'var(--brand-subtle)'
          : 'transparent',
        transition: 'background 0.15s',
        position: 'relative',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        if (!isCurrentlyPlaying)
          e.currentTarget.style.background = 'var(--bg-tertiary)'
      }}
      onMouseLeave={e => {
        if (!isCurrentlyPlaying)
          e.currentTarget.style.background = 'transparent'
      }}
      onClick={handlePlay}
    >
      {/* Album art */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        overflow: 'hidden',
        flexShrink: 0,
        background: 'var(--bg-tertiary)',
        position: 'relative',
      }}>
        <img
          src={getThumbnailUrl(song.thumbnailUrl)}
          alt={song.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.parentElement!.style.background =
              'linear-gradient(135deg, var(--brand-subtle), var(--brand-border))'
          }}
        />
        {isCurrentlyPlaying && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(124,58,237,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                width: 3,
                height: 14,
                background: 'white',
                borderRadius: 2,
                animation: `wave 0.8s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Song info */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: isCurrentlyPlaying
            ? 'var(--brand-primary)'
            : 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>
          {song.title}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}>
          {song.artist} · {formatDuration(song.duration)}
        </div>
      </div>

      {/* Like button */}
      {onLike && (
        <button
          onClick={e => { e.stopPropagation(); onLike() }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isLiked ? 'var(--error)' : 'var(--text-muted)',
            display: 'flex',
            padding: 4,
            flexShrink: 0,
          }}
        >
          <Heart size={18} fill={isLiked ? 'var(--error)' : 'none'} />
        </button>
      )}

      {/* Remove button */}
      {showRemove && onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
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
          <X size={18} />
        </button>
      )}

      {/* Options menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={e => { e.stopPropagation(); setShowMenu(m => !m) }}
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
          <MoreVertical size={18} />
        </button>

        {showMenu && (
          <>
            <div
              onClick={e => { e.stopPropagation(); setShowMenu(false) }}
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            />
            <div style={{
              position: 'absolute',
              right: 0,
              top: 32,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 14,
              padding: 8,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              minWidth: 200,
            }}>
              {menuOptions.map(opt => (
                <button
                  key={opt}
                  onClick={e => {
                    e.stopPropagation()
                    onOptionSelect?.(opt)
                    setShowMenu(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: 14,
                    color: opt.includes('Remove')
                      ? 'var(--error)'
                      : 'var(--text-primary)',
                    cursor: 'pointer',
                    borderRadius: 8,
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
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 6px; }
          50% { height: 18px; }
        }
      `}</style>
    </div>
  )
}