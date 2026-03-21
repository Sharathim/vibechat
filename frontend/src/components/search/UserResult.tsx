import { useNavigate } from 'react-router-dom'
import Avatar from '../common/Avatar'
import type { User } from '../../types/user'

interface UserResultProps {
  user: User
  followStatus?: 'none' | 'pending' | 'following'
  onFollow?: () => void
}

export default function UserResult({
  user,
  followStatus = 'none',
  onFollow,
}: UserResultProps) {
  const navigate = useNavigate()

  const buttonConfig = {
    none: {
      label: 'Follow',
      bg: 'transparent',
      color: 'var(--brand-primary)',
      border: '1.5px solid var(--brand-primary)',
    },
    pending: {
      label: 'Requested',
      bg: 'var(--bg-tertiary)',
      color: 'var(--text-secondary)',
      border: '1.5px solid var(--border-color)',
    },
    following: {
      label: 'Following',
      bg: 'var(--brand-primary)',
      color: 'white',
      border: '1.5px solid var(--brand-primary)',
    },
  }[followStatus]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        cursor: 'pointer',
        transition: 'background 0.15s',
        borderRadius: 12,
        margin: '0 4px',
      }}
      onMouseEnter={e =>
        e.currentTarget.style.background = 'var(--bg-tertiary)'
      }
      onMouseLeave={e =>
        e.currentTarget.style.background = 'transparent'
      }
      onClick={() => navigate(`/profile/${user.username}`)}
    >
      {/* Avatar with rank badge */}
      <Avatar
        name={user.name}
        src={user.avatarUrl}
        size={48}
        showRank={true}
        rankNumber={user.rankBadge}
      />

      {/* User info */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 2,
        }}>
          {user.name}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}>
          @{user.username}
        </div>
      </div>

      {/* Follow button */}
      <button
        onClick={e => {
          e.stopPropagation()
          onFollow?.()
        }}
        style={{
          height: 32,
          padding: '0 16px',
          borderRadius: 20,
          border: buttonConfig.border,
          background: buttonConfig.bg,
          color: buttonConfig.color,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          flexShrink: 0,
          transition: 'all 0.2s',
          minWidth: 90,
        }}
      >
        {buttonConfig.label}
      </button>
    </div>
  )
}