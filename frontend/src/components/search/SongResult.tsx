import { Play, Heart } from 'lucide-react'
import type { Song } from '../../types/song'
import { formatDuration } from '../../data/mockData'
import { useMusic } from '../../context/MusicContext'

interface SongResultProps {
  song: Song
  isLiked?: boolean
  onLike?: () => void
}

export default function SongResult({
  song,
  isLiked = false,
  onLike,
}: SongResultProps) {
  const { play } = useMusic()

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
        cursor: 'pointer',
        transition: 'background 0.15s',
        borderRadius: 12,
        margin: '0 4px',
      }}
      onMouseEnter={e =>
        e.currentTarget.style.background = 'var(--bg-tertiary)'
      }
      onMouseLeave={e =>
        e.currentTarget.style.background = 'transparent'
      }
    >
      {/* Album art */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        overflow: 'hidden',
        flexShrink: 0,
        background: 'var(--bg-tertiary)',
      }}>
        <img
          src={song.thumbnailUrl || undefined}
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
      <div style={{ flex: 1, overflow: 'hidden' }}
        onClick={handlePlay}
      >
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
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
          {song.artist}
        </div>
      </div>

      {/* Duration */}
      <span style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        flexShrink: 0,
        fontFamily: 'Space Mono, monospace',
      }}>
        {formatDuration(song.duration)}
      </span>

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
            transition: 'color 0.2s',
          }}
        >
          <Heart
            size={18}
            fill={isLiked ? 'var(--error)' : 'none'}
          />
        </button>
      )}

      {/* Play button */}
      <button
        onClick={e => { e.stopPropagation(); handlePlay() }}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--brand-primary)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          flexShrink: 0,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Play size={16} fill="white" />
      </button>
    </div>
  )
}