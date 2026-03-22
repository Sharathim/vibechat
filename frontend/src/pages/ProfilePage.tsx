import { useEffect, useState } from 'react'
import { Settings, Share2, Edit2, Music } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProfileHeader from '../components/profile/ProfileHeader'
import StatRow from '../components/profile/StatRow'
import EditProfileForm from '../components/profile/EditProfileForm'
import { mockCurrentUser } from '../data/mockData'
import usersApi from '../api/users'
import type { User } from '../types/user'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [user, setUser] = useState<User>(mockCurrentUser)
  const [isEditing, setIsEditing] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await usersApi.getMyProfile()
        const profileData = res.data.user
        setUser({
          id: profileData.id,
          username: profileData.username,
          name: profileData.name,
          email: profileData.gmail || '',
          avatarUrl: profileData.avatar_url || null,
          rankBadge: profileData.rank_badge || 1,
          bio: profileData.bio || '',
          isPrivate: profileData.is_private ?? true,
          followers: profileData.followers_count || 0,
          following: profileData.following_count || 0,
          vibes: profileData.vibes_count || 0,
        })
      } catch (err) {
        console.error('Profile fetch error:', err)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = (updates: Partial<User>) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    updateUser(updates)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <EditProfileForm
        user={user}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    )
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
      }}>
        <span style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          @{user.username}
        </span>
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--bg-tertiary)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'none'
          }
        >
          <Settings size={22} />
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Profile info */}
        <ProfileHeader user={user} />

        {/* Stats */}
        <StatRow
          vibes={user.vibes}
          followers={user.followers}
          following={user.following}
          onFollowersClick={() => setShowFollowers(true)}
          onFollowingClick={() => setShowFollowing(true)}
        />

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: 10,
          padding: '0 16px 20px',
        }}>
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-ghost"
            style={{ flex: 1, height: 40, fontSize: 14, gap: 6 }}
          >
            <Edit2 size={16} />
            Edit Profile
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, height: 40, fontSize: 14, gap: 6 }}
          >
            <Share2 size={16} />
            Share Profile
          </button>
        </div>

        {/* Empty content state */}
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
            Your vibes will appear here
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Start sharing your music moments
          </p>
        </div>
      </div>

      {/* Followers bottom sheet */}
      {showFollowers && (
        <FollowersSheet
          title="Followers"
          count={user.followers}
          onClose={() => setShowFollowers(false)}
        />
      )}

      {/* Following bottom sheet */}
      {showFollowing && (
        <FollowersSheet
          title="Following"
          count={user.following}
          onClose={() => setShowFollowing(false)}
        />
      )}
    </div>
  )
}

function FollowersSheet({
  title,
  count,
  onClose,
}: {
  title: string
  count: number
  onClose: () => void
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--overlay)',
          zIndex: 100,
        }}
      />
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--bg-elevated)',
        borderRadius: '28px 28px 0 0',
        borderTop: '1px solid var(--border-color)',
        zIndex: 101,
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'sheetUp 0.3s ease',
      }}>
        <div style={{
          width: 36, height: 4,
          background: 'var(--border-color)',
          borderRadius: 2,
          margin: '12px auto 0',
        }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700 }}>
            {title} ({count.toLocaleString()})
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: 20,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
          Connect to backend to show {title.toLowerCase()} list.
        </div>
      </div>
    </>
  )
}