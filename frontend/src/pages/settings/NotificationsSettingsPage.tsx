import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
          width: 44, height: 24, borderRadius: 12,
          cursor: 'pointer',
          background: value ? 'var(--brand-primary)' : 'var(--border-color)',
          position: 'relative', transition: 'background 0.25s', flexShrink: 0,
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'white', position: 'absolute', top: 3,
          left: value ? 23 : 3, transition: 'left 0.25s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  )
}

export default function NotificationsSettingsPage() {
  const navigate = useNavigate()
  const [followRequests, setFollowRequests] = useState(true)
  const [messages, setMessages] = useState(true)
  const [vibeRequests, setVibeRequests] = useState(true)
  const [sharedPlaylists, setSharedPlaylists] = useState(true)

  const groups = [
    {
      title: 'Social',
      items: [
        {
          label: 'Follow Requests',
          subtitle: 'When someone requests to follow you',
          value: followRequests,
          onChange: setFollowRequests,
        },
      ],
    },
    {
      title: 'Messages',
      items: [
        {
          label: 'New Messages',
          subtitle: 'When someone sends you a message',
          value: messages,
          onChange: setMessages,
        },
      ],
    },
    {
      title: 'Vibe',
      items: [
        {
          label: 'Vibe Requests',
          subtitle: 'When someone sends a Vibe request',
          value: vibeRequests,
          onChange: setVibeRequests,
        },
      ],
    },
    {
      title: 'Music',
      items: [
        {
          label: 'Shared Playlist Requests',
          subtitle: 'When someone invites you to a shared playlist',
          value: sharedPlaylists,
          onChange: setSharedPlaylists,
        },
      ],
    },
  ]

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
        }}>Notifications</h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {groups.map(({ title, items }) => (
          <div key={title}>
            <div style={{
              padding: '16px 16px 4px',
              fontSize: 11, fontWeight: 600,
              letterSpacing: '0.8px', textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>{title}</div>
            {items.map(item => (
              <ToggleRow key={item.label} {...item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}