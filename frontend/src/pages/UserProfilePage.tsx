import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MessageCircle, Lock, Music } from 'lucide-react'
import ProfileHeader from '../components/profile/ProfileHeader'
import StatRow from '../components/profile/StatRow'
import FollowButton from '../components/profile/FollowButton'
import { mockUsers } from '../data/mockData'

type FollowStatus = 'none' | 'pending' | 'following'

export default function UserProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()

  const user = mockUsers.find(u => u.username === username)
  const [followStatus, setFollowStatus] = useState<FollowStatus>('none')

  if (!user) {
    return (
      <div style={{
        height: '100%', display: 'flex',
        flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 12,
        color: 'var(--text-muted)',
      }}>
        <p style={{ fontSize: 16 }}>User not found</p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost"
          style={{ height: 40, fontSize: 14 }}
        >
          Go Back
        </button>
      </div>
    )
  }

  const isPrivateAndNotFollowing =
    user.isPrivate && followStatus !== 'following'

  const handleFollow = () => {
    if (followStatus === 'none') setFollowStatus('pending')
    else if (followStatus === 'pending') setFollowStatus('none')
  }

  const handleUnfollow = () => setFollowStatus('none')

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
        padding: '0 12px',
        gap: 8,
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 20,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--bg-tertiary)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'none'
          }
        >
          ↩
        </button>
        <span style={{
          flex: 1, fontSize: 15, fontWeight: 600,
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginRight: 40,
        }}>
          @{user.username}
        </span>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Profile info */}
        <ProfileHeader user={user} />

        {/* Stats */}
        <StatRow
          vibes={user.vibes}
          followers={user.followers}
          following={user.following}
        />

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: 10,
          padding: '0 16px 20px',
        }}>
          <FollowButton
            status={followStatus}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
          />
          {followStatus === 'following' && (
            <button
              onClick={() => navigate('/chat')}
              className="btn btn-primary"
              style={{ flex: 1, height: 40, fontSize: 14, gap: 6 }}
            >
              <MessageCircle size={16} />
              Message
            </button>
          )}
        </div>

        {/* Content area */}
        {isPrivateAndNotFollowing ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            <Lock
              size={40}
              style={{
                color: 'var(--text-muted)',
                marginBottom: 12,
              }}
            />
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>
              This account is private
            </h3>
            <p style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
            }}>
              Follow to see their vibes
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            <Music
              size={48}
              style={{ color: 'var(--border-color)', marginBottom: 16 }}
            />
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>
              No vibes yet
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {user.name} hasn't shared any music moments yet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}