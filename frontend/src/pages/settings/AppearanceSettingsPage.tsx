import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function AppearanceSettingsPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const themes = [
    {
      id: 'light' as const,
      label: 'Light',
      bg: '#FFFFFF',
      surface: '#F3F4F6',
      accent: '#7C3AED',
      text: '#0F0F14',
    },
    {
      id: 'dark' as const,
      label: 'Dark',
      bg: '#0D0D12',
      surface: '#1A1A24',
      accent: '#7C3AED',
      text: '#F1F5F9',
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
        }}>Appearance</h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.8px', textTransform: 'uppercase',
          color: 'var(--text-muted)', marginBottom: 16,
        }}>Theme</div>

        <div style={{ display: 'flex', gap: 16 }}>
          {themes.map(t => (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                flex: 1, cursor: 'pointer',
                border: `2px solid ${
                  theme === t.id
                    ? 'var(--brand-primary)'
                    : 'var(--border-color)'
                }`,
                borderRadius: 16,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                position: 'relative',
              }}
            >
              {/* Mini preview */}
              <div style={{
                background: t.bg,
                padding: 12,
                height: 100,
              }}>
                {/* Mock sidebar */}
                <div style={{ display: 'flex', gap: 8, height: '100%' }}>
                  <div style={{
                    width: 20, background: t.surface,
                    borderRadius: 4, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{
                      height: 8, background: t.accent,
                      borderRadius: 4, width: '60%',
                    }} />
                    <div style={{
                      height: 6, background: t.surface,
                      borderRadius: 4, width: '80%',
                    }} />
                    <div style={{
                      height: 6, background: t.surface,
                      borderRadius: 4, width: '70%',
                    }} />
                    <div style={{
                      marginTop: 'auto',
                      height: 16, background: t.surface,
                      borderRadius: 4,
                    }} />
                  </div>
                </div>
              </div>

              {/* Label + checkmark */}
              <div style={{
                padding: '10px 12px',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  {t.label}
                </span>
                {theme === t.id && (
                  <div style={{
                    width: 20, height: 20,
                    borderRadius: '50%',
                    background: 'var(--brand-primary)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white', fontSize: 12,
                  }}>
                    ✓
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <p style={{
          fontSize: 13, color: 'var(--text-muted)',
          marginTop: 16, textAlign: 'center',
        }}>
          Theme applies instantly across all screens
        </p>
      </div>
    </div>
  )
}