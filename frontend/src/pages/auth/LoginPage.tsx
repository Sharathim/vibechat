import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Music, Lock, AtSign } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import authApi from '../../api/auth'
import googleAuthService from '../../api/googleAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Transform backend user response to AuthContext format
  // Handles both old (gmail) and new (email) field names for compatibility
  const transformUser = (backendUser: any) => ({
    id: backendUser.id,
    username: backendUser.username,
    name: backendUser.name,
    email: backendUser.email || backendUser.gmail,
    avatarUrl: backendUser.avatar_url,
    rankBadge: backendUser.rank_badge,
    isPrivate: backendUser.is_private ?? false,
    bio: backendUser.bio ?? '',
  })

  // Handle successful Google auth (shared by popup and redirect flows)
  const completeGoogleLogin = async (idToken: string) => {
    try {
      const response = await authApi.googleLogin(idToken)
      const user = transformUser(response.data.user)
      login(user)
      navigate('/home')
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Google sign-in failed. Please try again.'
      )
      // Sign out from Firebase if backend fails
      await googleAuthService.signOut()
    }
  }

  // Check for Google redirect result on page load (fallback for popup-blocked)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setIsGoogleLoading(true)
        const googleUser = await googleAuthService.getRedirectResult()
        if (googleUser) {
          await completeGoogleLogin(googleUser.idToken)
        }
      } catch (err: any) {
        console.error('Redirect result error:', err)
        setError(err.message || 'Google sign-in failed.')
      } finally {
        setIsGoogleLoading(false)
      }
    }

    handleRedirectResult()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim()) {
      setError('Please enter your Gmail or username')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.login(identifier, password)
      const user = transformUser(response.data.user)
      login(user)
      navigate('/home')
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'Login failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleLoading(true)
    try {
      // Try popup first, returns user directly if successful
      const googleUser = await googleAuthService.signIn()
      if (googleUser) {
        // Popup succeeded - complete login
        await completeGoogleLogin(googleUser.idToken)
      }
      // If null, redirect was triggered - will be handled by useEffect on page reload
    } catch (err: any) {
      console.error('Google login error:', err)
      setError(
        err.message ||
        'Google sign-in failed. Please try again.'
      )
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
    }}>
      {/* Left brand panel desktop only */}
      <div
        className="desktop-only"
        style={{
          width: '45%',
          background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #06B6D4 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
          top: -100, right: -100,
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
          bottom: -80, left: -80,
        }} />
        <div style={{ textAlign: 'center', marginBottom: 48, zIndex: 1 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            backdropFilter: 'blur(10px)',
          }}>
            <Music size={36} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 36,
            fontWeight: 800, color: 'white', marginBottom: 8,
          }}>VibeChat</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
            Music meets social.
          </p>
        </div>
        {[
          { icon: '🎵', text: 'Stream any song, instantly' },
          { icon: '💬', text: 'Message friends in real-time' },
          { icon: '✨', text: 'Your vibe, your space' },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center',
            gap: 12, marginBottom: 16, zIndex: 1,
            width: '100%', maxWidth: 280,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, flexShrink: 0,
            }}>{icon}</div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>
              {text}
            </span>
          </div>
        ))}
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="mobile-only" style={{
            textAlign: 'center', marginBottom: 32,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--brand-primary)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 12px',
            }}>
              <Music size={28} color="white" />
            </div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 24,
              color: 'var(--brand-primary)',
            }}>VibeChat</h1>
          </div>

          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 28,
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8,
          }}>Welcome back</h2>
          <p style={{
            color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15,
          }}>Sign in to continue</p>

          <form onSubmit={handleLogin}>
            {error && (
              <div style={{
                background: 'var(--error-subtle)',
                border: '1px solid var(--error)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 14, color: 'var(--error)',
                marginBottom: 16, animation: 'shake 0.4s ease',
              }}>{error}</div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 6,
              }}>Gmail or Username</label>
              <div style={{ position: 'relative' }}>
                <AtSign size={18} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }} />
                <input
                  className="input"
                  type="text"
                  placeholder="your@gmail.com or username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  style={{ paddingLeft: 44 }}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 6,
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }} />
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: 44, paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-muted)',
                    padding: 0, display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <Link to="/forgot-password" style={{
                fontSize: 13, color: 'var(--brand-primary)', fontWeight: 500,
              }}>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </button>

            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 12, margin: '24px 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s ease',
                marginBottom: 24,
              }}
              onMouseOver={e => {
                if (!isGoogleLoading && !isLoading) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)'
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <p style={{
              textAlign: 'center', fontSize: 14,
              color: 'var(--text-secondary)',
            }}>
              Don't have an account?{' '}
              <Link to="/register" style={{
                color: 'var(--brand-primary)', fontWeight: 600,
              }}>Sign Up</Link>
            </p>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) { .desktop-only { display: none !important; } }
        @media (min-width: 768px) { .mobile-only { display: none !important; } }
      `}</style>
    </div>
  )
}