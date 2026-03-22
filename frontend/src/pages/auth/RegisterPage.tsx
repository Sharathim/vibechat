import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Music, Mail, User, AtSign, Lock } from 'lucide-react'
import OTPInput from '../../components/auth/OTPInput'
import PasswordStrengthBar from '../../components/auth/PasswordStrengthBar'
import { maskEmail } from '../../lib/utils'
import authApi from '../../api/auth'

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  // Step 2
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Step 3
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isValidEmail = (e: string) =>
    /^[^\s@]+@gmail\.com$/.test(e.trim())

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid Gmail address')
      return
    }
    setEmailError('')
    setIsLoading(true)
    try {
      const checkRes = await authApi.checkEmail(email)
      if (checkRes.data.exists) {
        setEmailError('An account with this email already exists')
        setIsLoading(false)
        return
      }
      await authApi.sendOTP(email, 'registration')
      setStep(2)
      startCountdown()
    } catch (err: any) {
      setEmailError(
        err.response?.data?.error || 'Failed to send OTP'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const startCountdown = () => {
    setCountdown(600)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      setOtpError('Please enter the 6-digit code')
      return
    }
    setOtpError('')
    setIsLoading(true)
    try {
      await authApi.verifyOTP(email, otp, 'registration')
      setStep(3)
    } catch (err: any) {
      setOtpError(
        err.response?.data?.error || 'Incorrect OTP'
      )
      setOtpError('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUsernameChange = (val: string) => {
    setUsername(val)
    setSuggestions([])
    if (!val) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(val)
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
    }, 500)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!username || usernameStatus !== 'available') {
      setFormError('Please choose a valid available username')
      return
    }
    if (!name.trim() || !/^[a-zA-Z\s]+$/.test(name)) {
      setFormError('Name must contain alphabets only')
      return
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      await authApi.register({
        gmail: email,
        username,
        name,
        password,
      })
      navigate('/login')
    } catch (err: any) {
      setFormError(
        err.response?.data?.error || 'Registration failed'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const StepIndicator = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
      gap: 0,
    }}>
      {[1, 2, 3].map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: s <= step ? 'var(--brand-primary)' : 'var(--bg-tertiary)',
            border: s <= step
              ? '2px solid var(--brand-primary)'
              : '2px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: s <= step ? 'white' : 'var(--text-muted)',
            transition: 'all 0.3s',
          }}>
            {s < step ? '✓' : s}
          </div>
          {i < 2 && (
            <div style={{
              width: 48,
              height: 2,
              background: s < step ? 'var(--brand-primary)' : 'var(--border-color)',
              transition: 'background 0.3s',
            }} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
          }}>
            <Music size={26} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 22,
            color: 'var(--brand-primary)',
          }}>
            VibeChat
          </h1>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px 28px' }}>
          <StepIndicator />

          {/* STEP 1 — Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <h2 style={{ marginBottom: 8, fontSize: 24 }}>
                What's your Gmail?
              </h2>
              <p style={{ marginBottom: 24, fontSize: 14 }}>
                We'll send a verification code to confirm it's you.
              </p>

              {emailError && (
                <div style={{
                  background: 'var(--error-subtle)',
                  border: '1px solid var(--error)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 14,
                  color: 'var(--error)',
                  marginBottom: 16,
                }}>
                  {emailError}
                </div>
              )}

              <div style={{ position: 'relative', marginBottom: 24 }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }} />
                <input
                  className={`input ${emailError ? 'error' : email && isValidEmail(email) ? 'success' : ''}`}
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError('') }}
                  style={{ paddingLeft: 44 }}
                  autoFocus
                />
                {email && isValidEmail(email) && (
                  <div style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--success)',
                    fontSize: 18,
                  }}>✓</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>

              <p style={{
                textAlign: 'center',
                marginTop: 16,
                fontSize: 14,
                color: 'var(--text-secondary)',
              }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                  Login
                </Link>
              </p>
            </form>
          )}

          {/* STEP 2 — OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <h2 style={{ marginBottom: 8, fontSize: 24 }}>
                Check your inbox
              </h2>
              <p style={{ marginBottom: 8, fontSize: 14 }}>
                Enter the 6-digit code sent to
              </p>
              <p style={{
                marginBottom: 24,
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                {maskEmail(email)}
              </p>

              <div style={{ marginBottom: 16 }}>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  hasError={!!otpError}
                />
              </div>

              {otpError && (
                <p style={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--error)',
                  marginBottom: 12,
                }}>
                  {otpError}
                </p>
              )}

              {countdown > 0 && (
                <p style={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--accent)',
                  marginBottom: 16,
                }}>
                  Code expires in {formatCountdown(countdown)}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isLoading || otp.length < 6}
                style={{ marginBottom: 12 }}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                className="btn btn-full"
                style={{
                  background: 'none',
                  color: countdown > 0
                    ? 'var(--text-muted)'
                    : 'var(--brand-primary)',
                  border: 'none',
                  fontSize: 14,
                }}
                disabled={countdown > 0}
                onClick={() => {
                  setOtp('')
                  startCountdown()
                }}
              >
                {countdown > 0
                  ? `Resend OTP in ${formatCountdown(countdown)}`
                  : 'Resend OTP'}
              </button>
            </form>
          )}

          {/* STEP 3 — Profile Setup */}
          {step === 3 && (
            <form onSubmit={handleRegister}>
              <h2 style={{ marginBottom: 8, fontSize: 24 }}>
                Set up your profile
              </h2>
              <p style={{ marginBottom: 24, fontSize: 14 }}>
                Choose how you appear on VibeChat
              </p>

              {formError && (
                <div style={{
                  background: 'var(--error-subtle)',
                  border: '1px solid var(--error)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 14,
                  color: 'var(--error)',
                  marginBottom: 16,
                }}>
                  {formError}
                </div>
              )}

              {/* Username */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <AtSign size={18} style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }} />
                  <input
                    className={`input ${
                      usernameStatus === 'taken' ? 'error' :
                      usernameStatus === 'available' ? 'success' : ''
                    }`}
                    type="text"
                    placeholder="your_username"
                    value={username}
                    onChange={e => handleUsernameChange(e.target.value)}
                    style={{ paddingLeft: 44, paddingRight: 44 }}
                    maxLength={30}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}>
                    {usernameStatus === 'checking' && (
                      <div style={{
                        width: 16,
                        height: 16,
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

                {/* Status message */}
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
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 8,
                  }}>
                    {suggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setUsername(s)
                          setUsernameStatus('available')
                          setSuggestions([])
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

              {/* Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }} />
                  <input
                    className="input"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ paddingLeft: 44 }}
                    maxLength={50}
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Alphabets and spaces only
                </p>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }} />
                  <input
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
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: 0,
                      display: 'flex',
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
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }} />
                  <input
                    className={`input ${
                      confirmPassword && password !== confirmPassword ? 'error' :
                      confirmPassword && password === confirmPassword ? 'success' : ''
                    }`}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: 44, paddingRight: 44 }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    {confirmPassword && password === confirmPassword && (
                      <span style={{ color: 'var(--success)' }}>✓</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirm(s => !s)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}