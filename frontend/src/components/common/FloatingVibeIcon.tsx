import { useState, useRef, useEffect } from 'react'
import { X, Maximize2, Plus } from 'lucide-react'
import { useVibe } from '../../context/VibeContext'

export default function FloatingVibeIcon() {
  const { isActive, endSession, expand } = useVibe()
  const [showMenu, setShowMenu] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(false)
  const isDragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, elX: 0, elY: 0 })
  const btnRef = useRef<HTMLDivElement>(null)

  // Set initial position bottom-right above nav
  useEffect(() => {
    if (!initialized) {
      setPos({
        x: window.innerWidth - 76,
        y: window.innerHeight - 148,
      })
      setInitialized(true)
    }
  }, [initialized])

  if (!isActive || !initialized) return null

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = false
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: pos.x,
      elY: pos.y,
    }

    const handleMouseMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - dragStart.current.mouseX)
      const dy = Math.abs(e.clientY - dragStart.current.mouseY)
      if (dx > 4 || dy > 4) isDragging.current = true

      const newX = dragStart.current.elX + (e.clientX - dragStart.current.mouseX)
      const newY = dragStart.current.elY + (e.clientY - dragStart.current.mouseY)

      // Clamp to window bounds
      const clamped = {
        x: Math.max(0, Math.min(window.innerWidth - 56, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 56, newY)),
      }
      setPos(clamped)
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    isDragging.current = false
    dragStart.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      elX: pos.x,
      elY: pos.y,
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - dragStart.current.mouseX)
      const dy = Math.abs(touch.clientY - dragStart.current.mouseY)
      if (dx > 4 || dy > 4) isDragging.current = true

      const newX = dragStart.current.elX + (touch.clientX - dragStart.current.mouseX)
      const newY = dragStart.current.elY + (touch.clientY - dragStart.current.mouseY)

      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 56, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 56, newY)),
      })
    }

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
  }

  const handleClick = () => {
    if (!isDragging.current) {
      setShowMenu(m => !m)
    }
  }

  const menuItems = [
    {
      icon: X,
      label: 'End Vibe',
      action: () => { endSession(); setShowMenu(false) },
      color: '#EF4444',
    },
    {
      icon: Maximize2,
      label: 'Open Vibe',
      action: () => { expand(); setShowMenu(false) },
      color: 'white',
    },
    {
      icon: Plus,
      label: 'Add Songs',
      action: () => setShowMenu(false),
      color: 'white',
    },
  ]

  return (
    <>
      {/* Close menu overlay */}
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 98 }}
        />
      )}

      <div
        ref={btnRef}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 99,
          userSelect: 'none',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Quick menu — appears above icon */}
        {showMenu && (
          <div style={{
            position: 'absolute',
            bottom: 64,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'flex-end',
            animation: 'scaleIn 0.2s ease',
          }}>
            {menuItems.map(({ icon: Icon, label, action, color }) => (
              <button
                key={label}
                onClick={(e) => { e.stopPropagation(); action() }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  background: 'var(--text-primary)',
                  color,
                  border: 'none',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-lg)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Main floating button */}
        <button
          onClick={handleClick}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--brand-primary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
            gap: 3,
          }}
        >
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              style={{
                width: 4,
                height: 18,
                background: 'white',
                borderRadius: 2,
                animation: `wave 1s ease-in-out ${delay}ms infinite`,
              }}
            />
          ))}
        </button>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 6px; }
          50% { height: 20px; }
        }
      `}</style>
    </>
  )
}