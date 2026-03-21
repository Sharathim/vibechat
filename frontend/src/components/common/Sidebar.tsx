import { useNavigate, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Search, Music, User } from 'lucide-react'

const navItems = [
  { label: 'Home', icon: Home, path: '/home' },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
  { label: 'Search', icon: Search, path: '/search' },
  { label: 'Music', icon: Music, path: '/music' },
  { label: 'Profile', icon: User, path: '/profile' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      <aside
        className="desktop-only"
        style={{
          width: 'var(--sidebar-w)',
          height: '100vh',
          background: 'var(--bg-elevated)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 32,
            paddingLeft: 8,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/home')}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Music size={20} color="white" />
          </div>
          <span
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--brand-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            VibeChat
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ label, icon: Icon, path }) => {
            const isActive = location.pathname === path ||
              (path !== '/home' && location.pathname.startsWith(path))

            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: isActive
                    ? 'var(--brand-subtle)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid var(--brand-border)'
                    : '1px solid transparent',
                  borderLeft: isActive
                    ? '3px solid var(--brand-primary)'
                    : '3px solid transparent',
                  color: isActive
                    ? 'var(--brand-primary)'
                    : 'var(--text-secondary)',
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </button>
            )
          })}
        </nav>
      </aside>

      <style>{`
        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
    </>
  )
}