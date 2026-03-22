import type { Message } from '../../types/chat'
import { Play } from 'lucide-react'
import { useMusic } from '../../context/MusicContext'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const { play } = useMusic()

  if (message.type === 'song' && message.song) {
    const song = message.song
    return (
      <div style={{
        alignSelf: isOwn ? 'flex-end' : 'flex-start',
        maxWidth: 280,
      }}>
        <div
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
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 12,
            background: 'var(--bg-elevated)',
            borderLeft: '4px solid var(--brand-primary)',
            borderRadius: '0 12px 12px 0',
            cursor: 'pointer',
            transition: 'background 0.15s',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--bg-tertiary)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'var(--bg-elevated)'
          }
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--bg-tertiary)',
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
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {song.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {song.artist}
            </div>
          </div>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Play size={14} fill="white" color="white" />
          </div>
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginTop: 4,
          textAlign: isOwn ? 'right' : 'left',
          padding: '0 4px',
        }}>
          {message.createdAt}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      alignSelf: isOwn ? 'flex-end' : 'flex-start',
      maxWidth: '72%',
    }}>
      <div style={{
        padding: '10px 14px',
        background: isOwn
          ? 'var(--brand-primary)'
          : 'var(--bg-tertiary)',
        color: isOwn ? 'white' : 'var(--text-primary)',
        borderRadius: isOwn
          ? '18px 18px 4px 18px'
          : '18px 18px 18px 4px',
        fontSize: 14,
        lineHeight: 1.5,
        wordBreak: 'break-word',
      }}>
        {message.content}
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        marginTop: 4,
        textAlign: isOwn ? 'right' : 'left',
        padding: '0 4px',
      }}>
        {message.createdAt}
        {isOwn && (
          <span style={{ marginLeft: 4 }}>
            {message.isRead ? '✓✓' : '✓'}
          </span>
        )}
      </div>
    </div>
  )
}