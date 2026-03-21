import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { mockNotifications } from '../../data/mockData'
import Avatar from './Avatar'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const markRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          position: 'relative',
          transition: 'color 0.2s',
        }}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              border: '2px solid var(--bg-elevated)',
              animation: 'pulse 2s infinite',
            }}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 48,
              right: 0,
              width: 320,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              overflow: 'hidden',
              maxHeight: 400,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 16px 12px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--text-primary)',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Check size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 14,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
                  You are all caught up!
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => markRead(notification.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      background: notification.isRead
                        ? 'transparent'
                        : 'var(--brand-subtle)',
                      borderLeft: notification.isRead
                        ? 'none'
                        : '3px solid var(--brand-primary)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Avatar
                      src={notification.fromUser.avatarUrl}
                      name={notification.fromUser.name}
                      size={40}
                    />
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: 14,
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        <strong>{notification.fromUser.name}</strong>
                        {' '}{notification.message}
                      </span>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        {notification.createdAt}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--brand-primary)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}