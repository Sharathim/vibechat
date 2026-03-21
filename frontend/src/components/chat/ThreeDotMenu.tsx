import { useState } from 'react'
import { MoreVertical, BellOff, Music, Trash2, MessageSquareX } from 'lucide-react'

interface ThreeDotMenuProps {
  onTurnOffVibe: () => void
  onViewVibes: () => void
  onRemoveChat: () => void
  onClearChat: () => void
}

export default function ThreeDotMenu({
  onTurnOffVibe,
  onViewVibes,
  onRemoveChat,
  onClearChat,
}: ThreeDotMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const items = [
    {
      icon: BellOff,
      label: 'Turn off Vibe requests',
      action: onTurnOffVibe,
      color: 'var(--text-primary)',
    },
    {
      icon: Music,
      label: 'View all Vibes',
      action: onViewVibes,
      color: 'var(--text-primary)',
    },
    {
      icon: MessageSquareX,
      label: 'Remove from chat list',
      action: onRemoveChat,
      color: 'var(--text-primary)',
    },
    {
      icon: Trash2,
      label: 'Clear chat',
      action: onClearChat,
      color: 'var(--error)',
    },
  ]

  return (
    <div style={{ position: 'relative' }}>
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
          transition: 'background 0.2s',
        }}
        onMouseEnter={e =>
          e.currentTarget.style.background = 'var(--bg-tertiary)'
        }
        onMouseLeave={e =>
          e.currentTarget.style.background = 'none'
        }
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div style={{
            position: 'absolute',
            top: 44,
            right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: 8,
            minWidth: 220,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            animation: 'scaleIn 0.2s ease',
          }}>
            {items.map(({ icon: Icon, label, action, color }) => (
              <button
                key={label}
                onClick={() => { action(); setIsOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '11px 14px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 10,
                  color,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e =>
                  e.currentTarget.style.background = 'var(--bg-tertiary)'
                }
                onMouseLeave={e =>
                  e.currentTarget.style.background = 'none'
                }
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}