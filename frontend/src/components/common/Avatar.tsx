import { getInitial, getAvatarColor } from '../../data/mockData'

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  showOnline?: boolean
  showRank?: boolean
  rankNumber?: number
  className?: string
}

export default function Avatar({
  src,
  name,
  size = 40,
  showOnline = false,
  showRank = false,
  rankNumber,
  className = '',
}: AvatarProps) {
  const fontSize = Math.max(size * 0.38, 11)

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {/* Avatar circle */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          background: src ? 'transparent' : getAvatarColor(name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 700,
          color: 'white',
          fontFamily: 'DM Sans, sans-serif',
          border: '2px solid var(--border-color)',
        }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          getInitial(name)
        )}
      </div>

      {/* Online indicator */}
      {showOnline && (
        <div
          style={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: Math.max(size * 0.22, 8),
            height: Math.max(size * 0.22, 8),
            borderRadius: '50%',
            background: 'var(--success)',
            border: '2px solid var(--bg-primary)',
          }}
        />
      )}

      {/* Rank badge */}
      {showRank && rankNumber !== undefined && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -4,
            background: 'var(--brand-primary)',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: 20,
            border: '2px solid var(--bg-primary)',
            fontFamily: 'DM Sans, sans-serif',
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}
        >
          #{rankNumber}
        </div>
      )}
    </div>
  )
}