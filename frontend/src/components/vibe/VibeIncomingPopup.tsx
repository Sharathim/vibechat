import { useEffect, useState } from 'react'
import { Music } from 'lucide-react'
import Avatar from '../common/Avatar'

interface VibeIncomingPopupProps {
  fromName: string
  fromAvatar: string | null
  onAccept: () => void
  onDecline: () => void
}

export default function VibeIncomingPopup({
  fromName,
  fromAvatar,
  onAccept,
  onDecline,
}: VibeIncomingPopupProps) {
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          onDecline()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const circumference = 2 * Math.PI * 26
  const strokeDashoffset = circumference * (1 - countdown / 30)

  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
      }} />

      {/* Popup card */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 28,
        padding: '36px 28px',
        width: 'min(320px, 90vw)',
        zIndex: 201,
        textAlign: 'center',
        animation: 'scaleIn 0.3s ease',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Animated icon with countdown ring */}
        <div style={{
          position: 'relative',
          width: 72, height: 72,
          margin: '0 auto 20px',
        }}>
          <svg
            width="72" height="72"
            style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="36" cy="36" r="26"
              fill="none"
              stroke="var(--brand-subtle)"
              strokeWidth="4"
            />
            <circle
              cx="36" cy="36" r="26"
              fill="none"
              stroke="var(--brand-primary)"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 52, height: 52,
              borderRadius: '50%',
              background: 'var(--brand-subtle)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Music size={24} style={{ color: 'var(--brand-primary)' }} />
            </div>
          </div>
        </div>

        <h3 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 18, fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: 8,
        }}>
          Vibe Request
        </h3>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, marginBottom: 8,
        }}>
          <Avatar name={fromName} src={fromAvatar} size={32} />
          <span style={{
            fontSize: 15, fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            {fromName}
          </span>
        </div>

        <p style={{
          fontSize: 14, color: 'var(--text-secondary)',
          marginBottom: 24,
        }}>
          wants to vibe with you
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onDecline}
            className="btn btn-ghost"
            style={{
              flex: 1, height: 44, fontSize: 14,
              color: 'var(--error)',
              borderColor: 'var(--error)',
            }}
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="btn btn-primary"
            style={{ flex: 1, height: 44, fontSize: 14 }}
          >
            Accept
          </button>
        </div>
      </div>
    </>
  )
}