import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import type { SongClip } from '../../types/feed'
import ClipFullScreen from './ClipFullScreen'
import Avatar from '../common/Avatar'
import feedApi from '../../api/feed'
import { useAuth } from '../../context/AuthContext'

const mapClip = (clip: any): SongClip => ({
  id: clip.id,
  userId: clip.user_id,
  userid: clip.userid || 'unknown',
  avatarUrl: clip.avatar_url || null,
  song: {
    id: clip.song_id,
    youtubeId: clip.youtube_id,
    youtube_id: clip.youtube_id,
    title: clip.title,
    artist: clip.artist,
    thumbnailUrl: clip.thumbnail_url || '',
    thumbnail_url: clip.thumbnail_url || '',
    audioUrl: null,
    s3_audio_url: null,
    duration: clip.duration || 0,
  },
  startSeconds: clip.start_seconds || 0,
  expiresAt: clip.expires_at,
  isViewed: Boolean(clip.is_viewed),
})

export default function ClipRow() {
  const { user } = useAuth()
  const [clips, setClips] = useState<SongClip[]>([])
  const [activeClip, setActiveClip] = useState<SongClip | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const fetchClips = async () => {
      try {
        const res = await feedApi.getClips()
        setClips((res.data.clips || []).map(mapClip))
      } catch {
        setClips([])
      }
    }

    fetchClips()
  }, [])

  const openClip = (clip: SongClip, index: number) => {
    setActiveClip(clip)
    setActiveIndex(index)
    setClips(prev =>
      prev.map(c => c.id === clip.id ? { ...c, isViewed: true } : c)
    )
    void feedApi.viewClip(clip.id)
  }

  const closeClip = () => setActiveClip(null)

  const goNext = () => {
    if (activeIndex < clips.length - 1) {
      const next = clips[activeIndex + 1]
      setActiveClip(next)
      setActiveIndex(activeIndex + 1)
      setClips(prev =>
        prev.map(c => c.id === next.id ? { ...c, isViewed: true } : c)
      )
    } else {
      closeClip()
    }
  }

  const goPrev = () => {
    if (activeIndex > 0) {
      const prev = clips[activeIndex - 1]
      setActiveClip(prev)
      setActiveIndex(activeIndex - 1)
    }
  }

  return (
    <>
      <div style={{
        display: 'flex',
        gap: 16,
        padding: '16px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {/* Own clip circle */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          cursor: 'pointer',
        }}>
          <div style={{ position: 'relative' }}>
            {/* Ring */}
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 3,
            }}>
              <Avatar
                name={user?.name || 'You'}
                src={user?.avatarUrl || null}
                size={60}
              />
            </div>
            {/* Plus badge */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              border: '2px solid var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Plus size={12} color="white" strokeWidth={3} />
            </div>
          </div>
          <span style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            maxWidth: 64,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            You
          </span>
        </div>

        {/* Other users' clips */}
        {clips.map((clip, index) => {
          const isViewed = clip.isViewed

          return (
            <div
              key={clip.id}
              onClick={() => openClip(clip, index)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              {/* Ring with gradient */}
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: isViewed
                  ? 'var(--border-color)'
                  : 'linear-gradient(135deg, var(--brand-primary), var(--accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 3,
                transition: 'opacity 0.2s',
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2,
                }}>
                  <Avatar
                    name={clip.userid}
                    src={clip.avatarUrl}
                    size={54}
                  />
                </div>
              </div>

              <span style={{
                fontSize: 11,
                color: isViewed
                  ? 'var(--text-muted)'
                  : 'var(--text-secondary)',
                maxWidth: 64,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: isViewed ? 400 : 500,
              }}>
                {clip.userid}
              </span>
            </div>
          )
        })}
      </div>

      {/* Full screen clip viewer */}
      {activeClip && (
        <ClipFullScreen
          clip={activeClip}
          onClose={closeClip}
          onNext={goNext}
          onPrev={goPrev}
          hasPrev={activeIndex > 0}
          hasNext={activeIndex < clips.length - 1}
        />
      )}

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  )
}