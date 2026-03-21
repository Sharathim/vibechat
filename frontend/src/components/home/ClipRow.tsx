import { useState } from 'react'
import { Plus } from 'lucide-react'
import { mockClips, mockCurrentUser } from '../../data/mockData'
import type { SongClip } from '../../types/feed'
import ClipFullScreen from './ClipFullScreen'
import Avatar from '../common/Avatar'

export default function ClipRow() {
  const [clips, setClips] = useState<SongClip[]>(mockClips)
  const [activeClip, setActiveClip] = useState<SongClip | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const openClip = (clip: SongClip, index: number) => {
    setActiveClip(clip)
    setActiveIndex(index)
    setClips(prev =>
      prev.map(c => c.id === clip.id ? { ...c, isViewed: true } : c)
    )
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
                name={mockCurrentUser.name}
                src={mockCurrentUser.avatarUrl}
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
                    name={clip.username}
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
                {clip.username}
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