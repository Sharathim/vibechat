interface PasswordStrengthBarProps {
  password: string
}

function getStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
const colors = ['', 'var(--error)', 'var(--warning)', '#84cc16', 'var(--success)']

export default function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  if (!password) return null
  const strength = getStrength(password)

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(level => (
          <div
            key={level}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: level <= strength
                ? colors[strength]
                : 'var(--border-color)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
      {strength > 0 && (
        <div
          style={{
            fontSize: 12,
            color: colors[strength],
            fontWeight: 500,
            textAlign: 'right',
          }}
        >
          {labels[strength]}
        </div>
      )}
    </div>
  )
}