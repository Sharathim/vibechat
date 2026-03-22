import { useState, useEffect } from 'react'
import { X, Heart, Plus, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SongClip } from '../../types/feed'
import Avatar from '../common/Avatar'

interface ClipFullScreenProps {
  clip: SongClip
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  hasPrev: boolean
  hasNext: boolean
}

export default function ClipFullScreen({
  clip,
  onClose,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
}: ClipFullScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  // Auto-advance progress over 30 seconds
  useEffect(() => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          onNext()
          return 100
        }
        return prev + (100 / 30 / 10)
      })
    }, 100)
    return () => clearInterval(interval)
  }, [clip.id])

  // Swipe handling
  let touchStartX = 0
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && hasNext) onNext()
      else if (diff < 0 && hasPrev) onPrev()
    }
  }

  // Get hours remaining
  const hoursLeft = Math.max(
    0,
    Math.round(
      (new Date(clip.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)
    )
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          zIndex: 10,
        }}
      >
        <X size={20} />
      </button>

      {/* Prev button (desktop) */}
      {hasPrev && (
        <button
          onClick={onPrev}
          style={{
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
          }}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Next button (desktop) */}
      {hasNext && (
        <button
          onClick={onNext}
          style={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
          }}
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Content */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}>
        {/* Who posted */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <Avatar
            name={clip.username}
            src={clip.avatarUrl}
            size={40}
          />
          <div>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'white',
            }}>
              @{clip.username}
            </div>
            <div style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
            }}>
              Clip expires in {hoursLeft}h
            </div>
          </div>
        </div>

        {/* Album art */}
        <div style={{
          width: 260,
          height: 260,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(124,58,237,0.3)',
        }}>
          <img
            src={clip.song.thumbnailUrl}
            alt={clip.song.title}
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
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'white',
            marginBottom: 4,
            fontFamily: 'Syne, sans-serif',
          }}>
            {clip.song.title}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            {clip.song.artist}
          </div>
        </div>

        {/* Progress bar (30 seconds) */}
        <div style={{ width: '100%' }}>
          <div style={{
            width: '100%',
            height: 3,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'white',
              borderRadius: 2,
              transition: 'width 0.1s linear',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {Math.round(progress * 0.3)}s
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              30s
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }}>
          <button
            onClick={() => setIsLiked(l => !l)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isLiked ? '#EF4444' : 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'transform 0.2s',
            }}
          >
            <Heart
              size={28}
              fill={isLiked ? '#EF4444' : 'none'}
              style={{
                transform: isLiked ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}
            />
            <span style={{ fontSize: 11 }}>Like</span>
          </button>

          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <Plus size={28} />
            <span style={{ fontSize: 11 }}>Save</span>
          </button>

          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <Share2 size={28} />
            <span style={{ fontSize: 11 }}>Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}