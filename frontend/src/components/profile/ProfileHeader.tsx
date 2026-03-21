import Avatar from '../common/Avatar'
import type { User } from '../../types/user'

interface ProfileHeaderProps {
  user: User
}

export default function ProfileHeader({
  user,
}: ProfileHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      padding: '20px 16px 16px',
    }}>
      {/* Avatar with rank badge */}
      <Avatar
        name={user.name}
        src={user.avatarUrl}
        size={80}
        showRank={true}
        rankNumber={user.rankBadge}
      />

      {/* Info */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        paddingTop: 4,
      }}>
        <div style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'Syne, sans-serif',
          marginBottom: 2,
        }}>
          {user.name}
        </div>
        <div style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginBottom: user.bio ? 8 : 0,
        }}>
          @{user.username}
        </div>
        {user.bio && (
          <div style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            {user.bio}
          </div>
        )}
      </div>
    </div>
  )
}