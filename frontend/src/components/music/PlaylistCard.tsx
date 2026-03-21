import { useNavigate } from 'react-router-dom'
import { Music } from 'lucide-react'
import type { Playlist } from '../../types/song'

interface PlaylistCardProps {
  playlist: Playlist
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/music/playlist/${playlist.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        cursor: 'pointer',
        borderRadius: 12,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e =>
        e.currentTarget.style.background = 'var(--bg-tertiary)'
      }
      onMouseLeave={e =>
        e.currentTarget.style.background = 'transparent'
      }
    >
      {/* Cover */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 10,
        background: playlist.isShared
          ? 'linear-gradient(135deg, var(--brand-primary), var(--accent))'
          : 'linear-gradient(135deg, var(--brand-subtle), var(--brand-border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {playlist.coverUrl ? (
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Music
            size={24}
            color={playlist.isShared ? 'white' : 'var(--brand-primary)'}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {playlist.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {playlist.isShared
            ? `Shared with ${playlist.sharedWith}`
            : `${playlist.songCount} songs`}
        </div>
      </div>

      {/* Chevron */}
      <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>›</span>
    </div>
  )
}