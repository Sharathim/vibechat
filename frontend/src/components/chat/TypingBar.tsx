import { useState, useRef } from 'react'
import { Camera, Music, Plus, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TypingBarProps {
  onSend: (message: string) => void
}

export default function TypingBar({ onSend }: TypingBarProps) {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const iconBtnStyle = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    flexShrink: 0,
    transition: 'color 0.2s, background 0.2s',
  } as const

  return (
    <div style={{
      padding: '10px 16px',
      background: 'var(--bg-elevated)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'flex-end',
      gap: 8,
      flexShrink: 0,
    }}>
      {/* Camera */}
      <button
        style={iconBtnStyle}
        title="Send photo"
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--brand-primary)'
          e.currentTarget.style.background = 'var(--brand-subtle)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.background = 'none'
        }}
      >
        <Camera size={20} />
      </button>

      {/* Song share */}
      <button
        style={{
          ...iconBtnStyle,
          color: 'var(--brand-primary)',
        }}
        title="Share a song"
        onClick={() => navigate('/search')}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--brand-subtle)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'none'
        }}
      >
        <Music size={20} />
      </button>

      {/* Plus */}
      <button
        style={iconBtnStyle}
        title="Attach file"
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--brand-primary)'
          e.currentTarget.style.background = 'var(--brand-subtle)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.background = 'none'
        }}
      >
        <Plus size={20} />
      </button>

      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Message..."
        rows={1}
        style={{
          flex: 1,
          background: 'var(--bg-tertiary)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 22,
          padding: '10px 16px',
          fontSize: 14,
          color: 'var(--text-primary)',
          fontFamily: 'DM Sans, sans-serif',
          outline: 'none',
          resize: 'none',
          minHeight: 44,
          maxHeight: 120,
          lineHeight: 1.5,
          transition: 'border-color 0.2s',
          overflowY: 'auto',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--brand-primary)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border-color)'
        }}
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: text.trim()
            ? 'var(--brand-primary)'
            : 'var(--bg-tertiary)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: text.trim() ? 'pointer' : 'not-allowed',
          color: text.trim() ? 'white' : 'var(--text-muted)',
          flexShrink: 0,
          transition: 'all 0.2s',
          transform: text.trim() ? 'scale(1)' : 'scale(0.9)',
        }}
      >
        <Send size={18} />
      </button>
    </div>
  )
}