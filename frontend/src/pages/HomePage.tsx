import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music } from 'lucide-react'
import NotificationBell from '../components/common/NotificationBell'
import ClipRow from '../components/home/ClipRow'
import FeedItem from '../components/home/FeedItem'
import type { FeedItem as FeedItemType } from '../types/feed'
import feedApi from '../api/feed'
import musicApi from '../api/music'

const mapFeedItem = (item: any): FeedItemType => ({
  id: item.id,
  song: {
    id: item.song.id,
    youtubeId: item.song.youtube_id,
    youtube_id: item.song.youtube_id,
    title: item.song.title,
    artist: item.song.artist,
    thumbnailUrl: item.song.thumbnail_url || '',
    thumbnail_url: item.song.thumbnail_url || '',
    audioUrl: item.song.s3_audio_url || null,
    s3_audio_url: item.song.s3_audio_url || null,
    duration: item.song.duration || 0,
  },
  likeCount: item.like_count || 0,
  activityType: item.activity_type || 'like',
  timestamp: item.timestamp || '',
  isLiked: Boolean(item.is_liked),
})

export default function HomePage() {
  const navigate = useNavigate()
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([])

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await feedApi.getFeed(1)
        setFeedItems((res.data.feed || []).map(mapFeedItem))
      } catch {
        setFeedItems([])
      }
    }

    fetchFeed()
  }, [])

  const handleLike = async (id: number) => {
    const target = feedItems.find(item => item.id === id)
    if (!target) return

    setFeedItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              isLiked: !item.isLiked,
              likeCount: item.isLiked
                ? item.likeCount - 1
                : item.likeCount + 1,
            }
          : item
      )
    )

    try {
      if (target.isLiked) {
        await musicApi.unlikeSong(target.song.id)
      } else {
        await musicApi.likeSong(target.song.id)
      }
    } catch {
      setFeedItems(prev =>
        prev.map(item =>
          item.id === id
            ? {
                ...item,
                isLiked: target.isLiked,
                likeCount: target.likeCount,
              }
            : item
        )
      )
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <header style={{
        height: 'var(--header-h)',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Music size={18} color="white" />
          </div>
          <span style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--brand-primary)',
          }}>
            VibeChat
          </span>
        </div>

        <NotificationBell />
      </header>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Desktop feed constraint */}
        <div style={{
          maxWidth: 600,
          margin: '0 auto',
          width: '100%',
        }}>

          {/* Clip Row */}
          <ClipRow />

          {/* Divider */}
          <div style={{
            height: 1,
            background: 'var(--border-subtle)',
            margin: '0 0 4px',
          }} />

          {/* Feed */}
          {feedItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 24px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 64,
                marginBottom: 16,
                opacity: 0.3,
              }}>
                🎵
              </div>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}>
                Nothing here yet
              </h3>
              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                marginBottom: 24,
                lineHeight: 1.5,
              }}>
                Follow people to see what they're vibing to
              </p>
              <button
                onClick={() => navigate('/search')}
                className="btn btn-ghost"
                style={{ height: 40, fontSize: 14 }}
              >
                Explore People →
              </button>
            </div>
          ) : (
            feedItems.map((item, index) => (
              <FeedItem
                key={item.id}
                item={item}
                onLike={() => handleLike(item.id)}
                showDivider={index < feedItems.length - 1}
              />
            ))
          )}

          {/* Bottom padding */}
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  )
}