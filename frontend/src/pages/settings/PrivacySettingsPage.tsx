import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface ToggleRowProps {
  label: string
  subtitle: string
  value: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, subtitle, value, onChange }: ToggleRowProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 15, fontWeight: 500,
          color: 'var(--text-primary)', marginBottom: 2,
        }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24,
          borderRadius: 12, cursor: 'pointer',
          background: value ? 'var(--brand-primary)' : 'var(--border-color)',
          position: 'relative',
          transition: 'background 0.25s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 18, height: 18,
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: 3,
          left: value ? 23 : 3,
          transition: 'left 0.25s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  )
}

export default function PrivacySettingsPage() {
  const navigate = useNavigate()
  const [isPrivate, setIsPrivate] = useState(true)
  const [showRankBadge, setShowRankBadge] = useState(true)
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [readReceipts, setReadReceipts] = useState(true)
  const [vibeRequests, setVibeRequests] = useState('everyone')

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      <header style={{
        height: 'var(--header-h)',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12, flexShrink: 0,
      }}>
        <button onClick={() => navigate('/settings')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: 20,
        }}>↩</button>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 20,
          fontWeight: 700, color: 'var(--text-primary)',
        }}>Privacy</h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Account section */}
        <div style={{
          padding: '16px 16px 4px',
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.8px', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>Account</div>
        <ToggleRow
          label="Private Account"
          subtitle="Only approved followers can see your content"
          value={isPrivate}
          onChange={setIsPrivate}
        />

        {/* Profile section */}
        <div style={{
          padding: '16px 16px 4px',
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.8px', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>Profile</div>
        <ToggleRow
          label="Show Rank Badge"
          subtitle="Display your #rank on your profile"
          value={showRankBadge}
          onChange={setShowRankBadge}
        />
        <ToggleRow
          label="Online Status"
          subtitle="Show when you're active to others"
          value={showOnlineStatus}
          onChange={setShowOnlineStatus}
        />

        {/* Messaging section */}
        <div style={{
          padding: '16px 16px 4px',
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.8px', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>Messaging</div>
        <ToggleRow
          label="Read Receipts"
          subtitle="Show when you've read messages"
          value={readReceipts}
          onChange={setReadReceipts}
        />

        {/* Vibe requests */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            fontSize: 15, fontWeight: 500,
            color: 'var(--text-primary)', marginBottom: 2,
          }}>Vibe Requests</div>
          <div style={{
            fontSize: 13, color: 'var(--text-muted)', marginBottom: 10,
          }}>Who can send you Vibe requests</div>
          <select
            value={vibeRequests}
            onChange={e => setVibeRequests(e.target.value)}
            style={{
              width: '100%', height: 44,
              background: 'var(--bg-tertiary)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 10, padding: '0 12px',
              fontSize: 14, color: 'var(--text-primary)',
              fontFamily: 'DM Sans, sans-serif',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="everyone">Everyone</option>
            <option value="following">People I follow</option>
            <option value="nobody">Nobody</option>
          </select>
        </div>

        {/* Blocked users */}
        <div style={{
          padding: '16px 16px 4px',
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.8px', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>Blocked Users</div>
        <div
          style={{
            display: 'flex', alignItems: 'center',
            padding: '14px 16px', cursor: 'pointer',
            borderBottom: '1px solid var(--border-subtle)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--bg-tertiary)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'transparent'
          }
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
              Blocked Users
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              0 blocked users
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </div>
  )
}