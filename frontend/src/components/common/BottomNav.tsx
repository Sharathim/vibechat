import { useNavigate, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Search, Music, User } from 'lucide-react'

const navItems = [
  { label: 'Home', icon: Home, path: '/home' },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
  { label: 'Search', icon: Search, path: '/search' },
  { label: 'Music', icon: Music, path: '/music' },
  { label: 'Profile', icon: User, path: '/profile' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      {/* Only show on mobile */}
      <nav
        style={{
          display: 'flex',
          height: 'var(--bottom-nav-h)',
          background: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border-color)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          flexShrink: 0,
          zIndex: 20,
        }}
        className="mobile-only"
      >
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path ||
            (path !== '/home' && location.pathname.startsWith(path))

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive
                  ? 'var(--brand-primary)'
                  : 'var(--text-muted)',
                transition: 'color 0.2s',
                padding: '8px 0',
              }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive ? 'var(--brand-primary)' : 'none'}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {label}
              </span>
              {isActive && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--brand-primary)',
                    position: 'absolute',
                    bottom: 6,
                  }}
                />
              )}
            </button>
          )
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  )
}