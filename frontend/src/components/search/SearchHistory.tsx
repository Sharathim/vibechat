import { X } from 'lucide-react'
import type { Song } from '../../types/song'
import type { User } from '../../types/user'
import Avatar from '../common/Avatar'
import { getThumbnailUrl } from '../../lib/thumbnail'

interface SongHistoryItem {
  id: number
  type: 'song'
  song: Song
}

interface UserHistoryItem {
  id: number
  type: 'user'
  user: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>
}

type HistoryItem = SongHistoryItem | UserHistoryItem

interface SearchHistoryProps {
  items: HistoryItem[]
  mode: 'song' | 'user'
  onSelect: (item: HistoryItem) => void
  onRemove: (id: number) => void
  onSeeAll: () => void
  onClearAll: () => void
}

export default function SearchHistory({
  items,
  mode,
  onSelect,
  onRemove,
  onSeeAll,
  onClearAll,
}: SearchHistoryProps) {
  const filtered = items.filter(i => i.type === mode).slice(0, 5)

  if (filtered.length === 0) return null

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 16px 8px',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          Recent
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={onSeeAll}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--brand-primary)',
              fontFamily: 'DM Sans, sans-serif',
              padding: 0,
            }}
          >
            See All
          </button>
          <button
            onClick={onClearAll}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-muted)',
              fontFamily: 'DM Sans, sans-serif',
              padding: 0,
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Items */}
      {filtered.map(item => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            cursor: 'pointer',
            borderRadius: 10,
            margin: '0 8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--bg-tertiary)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'transparent'
          }
        >
          {/* Left content */}
          <div
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}
            onClick={() => onSelect(item)}
          >
            {item.type === 'song' ? (
              <>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--bg-tertiary)',
                }}>
                  <img
                    src={getThumbnailUrl(item.song.thumbnailUrl)}
                    alt={item.song.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.style.background =
                        'linear-gradient(135deg, var(--brand-subtle), var(--brand-border))'
                    }}
                  />
                </div>
                <div style={{ overflow: 'hidden' }}>
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
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                  }}>
                    {item.song.artist}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Avatar
                  name={item.user.name}
                  src={item.user.avatarUrl}
                  size={40}
                />
                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {item.user.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                  }}>
                    @{item.user.username}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Remove button */}
          <button
            onClick={e => { e.stopPropagation(); onRemove(item.id) }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}