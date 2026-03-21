import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, Heart, SkipBack, SkipForward,
  Play, Pause, Shuffle, Repeat,
  RotateCcw, RotateCw, MoreVertical
} from 'lucide-react'
import { useMusic } from '../context/MusicContext'
import { formatTime } from '../lib/utils'

export default function NowPlayingPage() {
  const navigate = useNavigate()
  const {
    currentSong, isPlaying, progress,
     pause, resume, skip, setProgress
  } = useMusic()

  const [isLiked, setIsLiked] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)

  if (!currentSong) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        gap: 16,
        padding: 24,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64 }}>🎵</div>
        <h2>No song playing</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Search for a song to start listening
        </p>
        <button
          onClick={() => navigate('/search')}
          className="btn btn-primary"
          style={{ height: 44 }}
        >
          Find Music
        </button>
      </div>
    )
  }

  const elapsed = (progress / 100) * currentSong.duration
  const remaining = currentSong.duration - elapsed

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: `linear-gradient(180deg, #1a0a2e 0%, var(--bg-primary) 100%)`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Blurred bg art */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${currentSong.thumbnailUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(40px)',
        opacity: 0.15,
        transform: 'scale(1.1)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 24px',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 'var(--header-h)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <ChevronDown size={24} />
          </button>

          <span style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: 'white',
          }}>
            Now Playing
          </span>

          <button style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
          }}>
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Album art */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 0',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 280,
            aspectRatio: '1/1',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <img
              src={currentSong.thumbnailUrl}
              alt={currentSong.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Song info + like */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'white',
              fontFamily: 'Syne, sans-serif',
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {currentSong.title}
            </div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>
              {currentSong.artist}
            </div>
          </div>
          <button
            onClick={() => setIsLiked(l => !l)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isLiked ? '#EF4444' : 'rgba(255,255,255,0.6)',
              display: 'flex',
              padding: 8,
              flexShrink: 0,
            }}
          >
            <Heart
              size={26}
              fill={isLiked ? '#EF4444' : 'none'}
              style={{
                transform: isLiked ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              width: '100%',
              height: 4,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = ((e.clientX - rect.left) / rect.width) * 100
              setProgress(Math.max(0, Math.min(100, pct)))
            }}
          >
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'white',
              borderRadius: 2,
              transition: 'width 0.5s linear',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                right: -6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 0 4px rgba(0,0,0,0.3)',
              }} />
            </div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Space Mono, monospace' }}>
              {formatTime(elapsed)}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Space Mono, monospace' }}>
              -{formatTime(remaining)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 24,
        }}>
          {/* Skip back 10s */}
          <button
            onClick={() => setProgress(Math.max(0, progress - 10 / currentSong.duration * 100))}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', display: 'flex',
            }}
          >
            <RotateCcw size={28} />
          </button>

          {/* Previous */}
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'white', display: 'flex',
          }}>
            <SkipBack size={32} fill="white" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={isPlaying ? pause : resume}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying
              ? <Pause size={28} fill="white" />
              : <Play size={28} fill="white" />
            }
          </button>

          {/* Next */}
          <button
            onClick={skip}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'white', display: 'flex',
            }}
          >
            <SkipForward size={32} fill="white" />
          </button>

          {/* Skip forward 10s */}
          <button
            onClick={() => setProgress(Math.min(100, progress + 10 / currentSong.duration * 100))}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', display: 'flex',
            }}
          >
            <RotateCw size={28} />
          </button>
        </div>

        {/* Secondary controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          paddingBottom: 16,
        }}>
          <button
            onClick={() => setIsShuffle(s => !s)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isShuffle ? 'var(--brand-light)' : 'rgba(255,255,255,0.4)',
              display: 'flex', padding: 4, transition: 'color 0.2s',
            }}
          >
            <Shuffle size={22} />
          </button>
          <button
            onClick={() => setIsRepeat(r => !r)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isRepeat ? 'var(--brand-light)' : 'rgba(255,255,255,0.4)',
              display: 'flex', padding: 4, transition: 'color 0.2s',
            }}
          >
            <Repeat size={22} />
          </button>
        </div>
      </div>
    </div>
  )
}