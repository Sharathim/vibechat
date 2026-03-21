import { useState } from 'react'
import { Music } from 'lucide-react'

interface VibeRequestSheetProps {
  partnerName: string
  onSend: (isCoHost: boolean) => void
  onClose: () => void
}

export default function VibeRequestSheet({
  partnerName,
  onSend,
  onClose,
}: VibeRequestSheetProps) {
  const [isCoHost, setIsCoHost] = useState(false)

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--overlay)',
          zIndex: 100,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--bg-elevated)',
        borderRadius: '28px 28px 0 0',
        borderTop: '1px solid var(--border-color)',
        padding: '0 20px 32px',
        zIndex: 101,
        animation: 'sheetUp 0.3s ease',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4,
          background: 'var(--border-color)',
          borderRadius: 2,
          margin: '12px auto 20px',
        }} />

        {/* Icon */}
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: 'var(--brand-subtle)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: 'var(--shadow-brand)',
        }}>
          <Music size={28} style={{ color: 'var(--brand-primary)' }} />
        </div>

        <h3 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 20, fontWeight: 700,
          color: 'var(--text-primary)',
          textAlign: 'center', marginBottom: 6,
        }}>
          Start a Vibe with {partnerName}
        </h3>
        <p style={{
          fontSize: 14, color: 'var(--text-secondary)',
          textAlign: 'center', marginBottom: 24,
        }}>
          Listen to music together in sync
        </p>

        {/* Co-host toggle */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '14px 16px',
          background: 'var(--bg-tertiary)',
          borderRadius: 14, marginBottom: 20,
          gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 15, fontWeight: 600,
              color: 'var(--text-primary)', marginBottom: 2,
            }}>
              Co-Host Mode
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {isCoHost
                ? 'Both of you have full control'
                : 'You control playback. Both can add songs.'}
            </div>
          </div>
          <div
            onClick={() => setIsCoHost(c => !c)}
            style={{
              width: 44, height: 24, borderRadius: 12,
              cursor: 'pointer', flexShrink: 0,
              background: isCoHost
                ? 'var(--brand-primary)'
                : 'var(--border-color)',
              position: 'relative',
              transition: 'background 0.25s',
            }}
          >
            <div style={{
              width: 18, height: 18,
              borderRadius: '50%', background: 'white',
              position: 'absolute', top: 3,
              left: isCoHost ? 23 : 3,
              transition: 'left 0.25s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        <button
          onClick={() => onSend(isCoHost)}
          className="btn btn-primary btn-full"
          style={{ gap: 8 }}
        >
          <Music size={18} />
          Send Vibe Request
        </button>
      </div>
    </>
  )
}