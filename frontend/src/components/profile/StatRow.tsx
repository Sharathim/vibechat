interface StatRowProps {
  vibes: number
  followers: number
  following: number
  onFollowersClick?: () => void
  onFollowingClick?: () => void
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

export default function StatRow({
  vibes,
  followers,
  following,
  onFollowersClick,
  onFollowingClick,
}: StatRowProps) {
  const stats = [
    { label: 'Vibes', value: vibes, onClick: undefined },
    { label: 'Followers', value: followers, onClick: onFollowersClick },
    { label: 'Following', value: following, onClick: onFollowingClick },
  ]

  return (
    <div style={{
      display: 'flex',
      borderTop: '1px solid var(--border-subtle)',
      borderBottom: '1px solid var(--border-subtle)',
      margin: '0 0 16px',
    }}>
      {stats.map(({ label, value, onClick }, i) => (
        <div
          key={label}
          onClick={onClick}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 0',
            cursor: onClick ? 'pointer' : 'default',
            borderRight: i < 2
              ? '1px solid var(--border-subtle)'
              : 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => {
            if (onClick)
              e.currentTarget.style.background = 'var(--bg-tertiary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: 'Syne, sans-serif',
            marginBottom: 2,
          }}>
            {formatCount(value)}
          </div>
          <div style={{
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}