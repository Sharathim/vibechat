import { useState } from 'react'
import { Play, Heart, Plus, Share2 } from 'lucide-react'
import type { FeedItem as FeedItemType } from '../../types/feed'
import { useMusic } from '../../context/MusicContext'
import { getThumbnailUrl } from '../../lib/thumbnail'

interface FeedItemProps {
  item: FeedItemType
  onLike: () => void
  showDivider: boolean
}

export default function FeedItem({ item, onLike, showDivider }: FeedItemProps) {
  const { play } = useMusic()
  const [showPlusMenu, setShowPlusMenu] = useState(false)

  const countText = () => {
    const count = item.likeCount
    const action = item.activityType === 'vibe'
      ? 'vibed to'
      : item.activityType === 'both'
      ? 'liked or vibed to'
      : 'liked'
    const people = count === 1 ? 'person' : 'people'
    return `${count} ${people} you follow ${action} this`
  }

  const handlePlay = () => {
    play({
      id: item.song.id,
      youtubeId: (item.song as any).youtube_id || item.song.youtubeId || '',
      title: item.song.title,
      artist: item.song.artist,
      thumbnailUrl: (item.song as any).thumbnail_url || item.song.thumbnailUrl || '',
      audioUrl: (item.song as any).s3_audio_url || item.song.audioUrl || null,
      duration: item.song.duration,
    })
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Image — full width, no card borders */}
      <div style={{
        width: '100%',
        aspectRatio: '1/1',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-tertiary)',
      }}>
        <img
          src={getThumbnailUrl(item.song.thumbnailUrl)}
          alt={item.song.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.parentElement!.style.background =
              'linear-gradient(135deg, var(--brand-subtle), var(--brand-border))'
          }}
        />

        {/* Gradient overlay at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.75) 100%)',
          padding: '32px 16px 16px',
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'white',
            marginBottom: 2,
            fontFamily: 'Syne, sans-serif',
          }}>
            {item.song.title}
          </div>
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.75)',
          }}>
            {item.song.artist}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        gap: 4,
        background: 'var(--bg-primary)',
      }}>
        {/* Play */}
        <button
          onClick={handlePlay}
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
            flexShrink: 0,
            marginRight: 4,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Play size={18} fill="white" />
        </button>

        {/* Like */}
        <button
          onClick={onLike}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: item.isLiked ? 'var(--error)' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
        >
          <Heart
            size={22}
            fill={item.isLiked ? 'var(--error)' : 'none'}
            style={{
              transform: item.isLiked ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s',
            }}
          />
        </button>

        {/* Add to library */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPlusMenu(m => !m)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <Plus size={22} />
          </button>

          {showPlusMenu && (
            <>
              <div
                onClick={() => setShowPlusMenu(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 40,
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 48,
                left: 0,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: 8,
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                minWidth: 180,
              }}>
                {['Add to Queue', 'Add to Playlist', 'Download'].map(option => (
                  <button
                    key={option}
                    onClick={() => setShowPlusMenu(false)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: 14,
                      color: 'var(--text-primary)',
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
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Share — pushed to right */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            marginLeft: 'auto',
          }}
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Count + time */}
      <div style={{
        padding: '0 16px 16px',
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginBottom: 2,
        }}>
          {countText()}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {item.timestamp}
        </div>
      </div>

      {/* Divider between items */}
      {showDivider && (
        <div style={{
          height: 8,
          background: 'var(--bg-tertiary)',
        }} />
      )}
    </div>
  )
}