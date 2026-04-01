import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import authApi from '../../api/auth'
import googleAuthService from '../../api/googleAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoggedIn } = useAuth()

  const [error, setError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // If already logged in, go home
  useEffect(() => {
    if (isLoggedIn) navigate('/home', { replace: true })
  }, [isLoggedIn, navigate])

  // Transform backend user response to AuthContext format
  const transformUser = (backendUser: any) => ({
    id: backendUser.id,
    userid: backendUser.username || backendUser.userid,
    name: backendUser.name,
    email: backendUser.email,
    avatarUrl: backendUser.avatar_url || null,
    rankBadge: backendUser.rank_badge || 0,
    isPrivate: backendUser.is_private ?? false,
    bio: backendUser.bio ?? '',
  })

  // Handle Google auth response
  const completeGoogleAuth = async (idToken: string) => {
    try {
      const response = await authApi.googleAuth(idToken)
      const { exists, user, googleId, email } = response.data

      if (exists && user) {
        // Existing user → login + go home
        login(transformUser(user))
        navigate('/home')
      } else {
        // New user → go to complete profile
        navigate('/complete-profile', {
          state: { googleId, email },
        })
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Google sign-in failed. Please try again.'
      )
      await googleAuthService.signOut()
    }
  }

  // Check for Google redirect result on page load
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setIsGoogleLoading(true)
        const googleUser = await googleAuthService.getRedirectResult()
        if (googleUser) {
          await completeGoogleAuth(googleUser.idToken)
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

  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleLoading(true)
    try {
      const googleUser = await googleAuthService.signIn()
      if (googleUser) {
        await completeGoogleAuth(googleUser.idToken)
      }
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
      {/* Left brand panel — desktop only */}
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

      {/* Right panel — Google sign-in */}
      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
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
          }}>Welcome to VibeChat</h2>
          <p style={{
            color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15,
          }}>Sign in to start vibing</p>

          {error && (
            <div style={{
              background: 'var(--error-subtle)',
              border: '1px solid var(--error)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 14, color: 'var(--error)',
              marginBottom: 16, animation: 'shake 0.4s ease',
            }}>{error}</div>
          )}

          {/* Google sign-in button */}
          <button
            type="button"
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 12,
              border: '1.5px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 600,
              cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.2s ease',
              opacity: isGoogleLoading ? 0.7 : 1,
            }}
            onMouseOver={e => {
              if (!isGoogleLoading) {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
                e.currentTarget.style.borderColor = 'var(--brand-primary)'
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
              e.currentTarget.style.borderColor = 'var(--border-color)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
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
            {isGoogleLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 16, height: 16,
                  border: '2px solid var(--brand-primary)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Signing in...
              </span>
            ) : (
              'Continue with Google'
            )}
          </button>

          <p style={{
            textAlign: 'center', fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 24,
            lineHeight: 1.5,
          }}>
            By continuing, you agree to VibeChat's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) { .desktop-only { display: none !important; } }
        @media (min-width: 768px) { .mobile-only { display: none !important; } }
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