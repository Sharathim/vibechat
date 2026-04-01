import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Music, User, AtSign, Lock } from 'lucide-react'
import PasswordStrengthBar from '../../components/auth/PasswordStrengthBar'
import { useAuth } from '../../context/AuthContext'
import authApi from '../../api/auth'

export default function CompleteProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // Get Google OAuth data from navigation state
  const googleId = (location.state as any)?.googleId || ''
  const email = (location.state as any)?.email || ''

  // If no Google data, redirect back to login
  useEffect(() => {
    if (!googleId || !email) {
      navigate('/login', { replace: true })
    }
  }, [googleId, email, navigate])

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameError, setUsernameError] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Username validation regex (client-side)
  const isValidUsername = (u: string) =>
    /^[a-z][a-z0-9_]{2,19}$/.test(u) && !u.includes('__') && !u.endsWith('_')

  const handleUsernameChange = (val: string) => {
    const lowered = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(lowered)
    setSuggestions([])
    setUsernameError('')

    if (!lowered) {
      setUsernameStatus('idle')
      return
    }

    if (!isValidUsername(lowered)) {
      setUsernameStatus('idle')
      if (lowered.length < 3) setUsernameError('Username must be at least 3 characters')
      else if (!/^[a-z]/.test(lowered)) setUsernameError('Must start with a letter')
      else if (lowered.includes('__')) setUsernameError('No consecutive underscores')
      else if (lowered.endsWith('_')) setUsernameError('Cannot end with underscore')
      else setUsernameError('Only lowercase letters, numbers and underscores')
      return
    }

    setUsernameStatus('checking')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(lowered)
        if (res.data.available) {
          setUsernameStatus('available')
          setSuggestions([])
        } else {
          setUsernameStatus('taken')
          setSuggestions(res.data.suggestions || [])
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    // Client-side validation
    if (!name.trim() || !/^[a-zA-Z\s]+$/.test(name)) {
      setFormError('Name must contain alphabets only')
      return
    }
    if (!username || usernameStatus !== 'available') {
      setFormError('Please choose a valid available username')
      return
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setFormError('Password must contain at least one uppercase letter')
      return
    }
    if (!/[a-z]/.test(password)) {
      setFormError('Password must contain at least one lowercase letter')
      return
    }
    if (!/[0-9]/.test(password)) {
      setFormError('Password must contain at least one number')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.createUser({
        googleId,
        email,
        name: name.trim(),
        username,
        password,
        confirmPassword,
      })

      const user = response.data.user
      login({
        id: user.id,
        userid: user.username,
        name: user.name,
        email: user.email,
        avatarUrl: null,
        rankBadge: 0,
        isPrivate: false,
        bio: '',
      })
      navigate('/home')
    } catch (err: any) {
      const errorData = err.response?.data
      setFormError(errorData?.error || 'Failed to create account')
      if (errorData?.suggestions) {
        setSuggestions(errorData.suggestions)
        setUsernameStatus('taken')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--brand-primary)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 10px',
          }}>
            <Music size={26} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 22,
            color: 'var(--brand-primary)',
          }}>VibeChat</h1>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px 28px' }}>
          <h2 style={{
            marginBottom: 8, fontSize: 24,
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            Complete your profile
          </h2>
          <p style={{
            marginBottom: 6, fontSize: 14,
            color: 'var(--text-secondary)',
          }}>
            Set up your identity on VibeChat
          </p>
          <p style={{
            marginBottom: 24, fontSize: 13,
            color: 'var(--text-muted)',
          }}>
            Signed in as <strong style={{ color: 'var(--brand-primary)' }}>{email}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            {formError && (
              <div style={{
                background: 'var(--error-subtle)',
                border: '1px solid var(--error)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 14,
                color: 'var(--error)',
                marginBottom: 16,
                animation: 'shake 0.4s ease',
              }}>{formError}</div>
            )}

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 6,
              }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                }} />
                <input
                  id="name-input"
                  className="input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ paddingLeft: 44 }}
                  maxLength={50}
                  autoFocus
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Alphabets and spaces only
              </p>
            </div>

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 6,
              }}>Username</label>
              <div style={{ position: 'relative' }}>
                <AtSign size={18} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                }} />
                <input
                  id="username-input"
                  className={`input ${usernameStatus === 'taken' ? 'error' :
                    usernameStatus === 'available' ? 'success' : ''}`}
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  style={{ paddingLeft: 44, paddingRight: 44 }}
                  maxLength={20}
                />
                <div style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                }}>
                  {usernameStatus === 'checking' && (
                    <div style={{
                      width: 16, height: 16,
                      border: '2px solid var(--brand-primary)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                  )}
                  {usernameStatus === 'available' && (
                    <span style={{ color: 'var(--success)', fontSize: 16 }}>✓</span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span style={{ color: 'var(--error)', fontSize: 16 }}>✗</span>
                  )}
                </div>
              </div>

              {/* Username status messages */}
              {usernameError && (
                <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>
                  {usernameError}
                </p>
              )}
              {usernameStatus === 'available' && (
                <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>
                  Username is available
                </p>
              )}
              {usernameStatus === 'taken' && (
                <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>
                  Username already taken
                </p>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div style={{
                  display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8,
                }}>
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setUsername(s)
                        setUsernameStatus('available')
                        setSuggestions([])
                        setUsernameError('')
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        border: '1.5px solid var(--brand-primary)',
                        background: 'transparent',
                        color: 'var(--brand-primary)',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--brand-subtle)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 6,
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                }} />
                <input
                  id="password-input"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: 44, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    padding: 0, display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 6,
              }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                }} />
                <input
                  id="confirm-password-input"
                  className={`input ${confirmPassword && password !== confirmPassword ? 'error' :
                    confirmPassword && password === confirmPassword ? 'success' : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: 44, paddingRight: 44 }}
                />
                <div style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', display: 'flex',
                  alignItems: 'center', gap: 8,
                }}>
                  {confirmPassword && password === confirmPassword && (
                    <span style={{ color: 'var(--success)' }}>✓</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 0, display: 'flex',
                    }}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="create-account-btn"
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
