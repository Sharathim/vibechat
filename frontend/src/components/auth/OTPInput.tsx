import { useRef, useState } from 'react'
import type { KeyboardEvent, ClipboardEvent } from 'react'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  hasError?: boolean
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  hasError = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [shake, setShake] = useState(false)

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const newDigits = [...digits]
    newDigits[index] = val.slice(-1)
    const newValue = newDigits.join('')
    onChange(newValue)
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted)
    const nextIndex = Math.min(pasted.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  if (hasError && !shake) {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        animation: shake ? 'shake 0.4s ease' : 'none',
      }}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: 52,
            height: 60,
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 700,
            fontFamily: 'Space Mono, monospace',
            background: digit
              ? 'var(--brand-subtle)'
              : 'var(--bg-tertiary)',
            border: `2px solid ${
              hasError
                ? 'var(--error)'
                : digit
                ? 'var(--brand-primary)'
                : 'var(--border-color)'
            }`,
            borderRadius: 12,
            outline: 'none',
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
            cursor: 'text',
          }}
          onFocus={e => {
            e.target.style.borderColor = hasError
              ? 'var(--error)'
              : 'var(--brand-primary)'
            e.target.style.boxShadow = hasError
              ? '0 0 0 3px rgba(239,68,68,0.12)'
              : '0 0 0 3px rgba(124,58,237,0.12)'
          }}
          onBlur={e => {
            e.target.style.boxShadow = 'none'
          }}
        />
      ))}
    </div>
  )
}