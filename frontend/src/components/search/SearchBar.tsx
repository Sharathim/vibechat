import { useRef } from 'react'
import { Search, Music, User, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  mode: 'song' | 'user'
  onModeChange: (mode: 'song' | 'user') => void
  onClear: () => void
}

export default function SearchBar({
  value,
  onChange,
  mode,
  onModeChange,
  onClear,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-elevated)',
      border: '1.5px solid var(--border-color)',
      borderRadius: 14,
      padding: '0 12px',
      height: 52,
      gap: 10,
      boxShadow: 'var(--shadow-sm)',
      transition: 'border-color 0.2s',
    }}
    onClick={() => inputRef.current?.focus()}
    >
      {/* Search icon */}
      <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={
          mode === 'song'
            ? 'Search songs...'
            : 'Search user by username...'
        }
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          fontSize: 15,
          color: 'var(--text-primary)',
          fontFamily: 'DM Sans, sans-serif',
        }}
        autoFocus
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      )}

      {/* Mode toggle */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-tertiary)',
        borderRadius: 8,
        padding: 3,
        gap: 2,
        flexShrink: 0,
      }}>
        <button
          onClick={() => onModeChange('song')}
          title="Search songs"
          style={{
            width: 30,
            height: 26,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: mode === 'song'
              ? 'var(--brand-primary)'
              : 'transparent',
            color: mode === 'song' ? 'white' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          <Music size={14} />
        </button>
        <button
          onClick={() => onModeChange('user')}
          title="Search users"
          style={{
            width: 30,
            height: 26,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: mode === 'user'
              ? 'var(--brand-primary)'
              : 'transparent',
            color: mode === 'user' ? 'white' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          <User size={14} />
        </button>
      </div>
    </div>
  )
}