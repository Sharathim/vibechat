import { useState } from 'react'

type FollowStatus = 'none' | 'pending' | 'following'

interface FollowButtonProps {
  status: FollowStatus
  onFollow: () => void
  onUnfollow: () => void
}

export default function FollowButton({
  status,
  onFollow,
  onUnfollow,
}: FollowButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  if (status === 'none') {
    return (
      <button
        onClick={onFollow}
        className="btn btn-primary"
        style={{ flex: 1, height: 40, fontSize: 14 }}
      >
        Follow
      </button>
    )
  }

  if (status === 'pending') {
    return (
      <button
        onClick={onUnfollow}
        className="btn btn-ghost"
        style={{ flex: 1, height: 40, fontSize: 14 }}
      >
        Requested
      </button>
    )
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(d => !d)}
        className="btn btn-ghost"
        style={{ width: '100%', height: 40, fontSize: 14 }}
      >
        Following ▾
      </button>

      {showDropdown && (
        <>
          <div
            onClick={() => setShowDropdown(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div style={{
            position: 'absolute',
            top: 44,
            left: 0,
            right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 8,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
          }}>
            <button
              onClick={() => {
                onUnfollow()
                setShowDropdown(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                borderRadius: 8,
                color: 'var(--error)',
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e =>
                e.currentTarget.style.background = 'var(--error-subtle)'
              }
              onMouseLeave={e =>
                e.currentTarget.style.background = 'none'
              }
            >
              Unfollow
            </button>
          </div>
        </>
      )}
    </div>
  )
}