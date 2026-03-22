import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Music } from 'lucide-react'
import OTPInput from '../../components/auth/OTPInput'
import PasswordStrengthBar from '../../components/auth/PasswordStrengthBar'
import { maskEmail } from '../../lib/utils'
import authApi from '../../api/auth'

type Step = 1 | 2 | 3

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const isValidEmail = (e: string) => /^[^\s@]+@gmail\.com$/.test(e.trim())

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid Gmail address')
      return
    }
    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
      setStep(2)
    } catch (err: any) {
      setEmailError(
        err.response?.data?.error || 'Failed to send OTP'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      setOtpError('Please enter the 6-digit code')
      return
    }
    setIsLoading(true)
    try {
      await authApi.verifyOTP(email, otp, 'password_reset')
      setStep(3)
    } catch (err: any) {
      setOtpError(
        err.response?.data?.error || 'Incorrect OTP'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      await authApi.resetPassword(email, newPassword)
      setIsDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setFormError(
        err.response?.data?.error || 'Failed to reset password'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const StepIndicator = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      gap: 0,
    }}>
      {[1, 2, 3].map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: s <= step ? 'var(--brand-primary)' : 'var(--bg-tertiary)',
            border: `2px solid ${s <= step ? 'var(--brand-primary)' : 'var(--border-color)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: s <= step ? 'white' : 'var(--text-muted)',
            transition: 'all 0.3s',
          }}>
            {s < step ? '✓' : s}
          </div>
          {i < 2 && (
            <div style={{
              width: 40,
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
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
          }}>
            <Music size={24} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 20,
            color: 'var(--brand-primary)',
          }}>
            VibeChat
          </h1>
        </div>

        <div className="card" style={{ padding: '32px 28px' }}>
          <StepIndicator />

          {/* Success state */}
          {isDone && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                fontSize: 48,
                marginBottom: 16,
                animation: 'scaleIn 0.4s ease',
              }}>
                ✅
              </div>
              <h3 style={{ marginBottom: 8 }}>Password Reset!</h3>
              <p style={{ fontSize: 14 }}>Redirecting to login...</p>
            </div>
          )}

          {/* Step 1 */}
          {!isDone && step === 1 && (
            <form onSubmit={handleSendOTP}>
              <h2 style={{ marginBottom: 8, fontSize: 22 }}>Reset your password</h2>
              <p style={{ marginBottom: 24, fontSize: 14 }}>
                Enter your Gmail to receive a verification code
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
                  className="input"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError('') }}
                  style={{ paddingLeft: 44 }}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
                Remember your password?{' '}
                <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                  Login
                </Link>
              </p>
            </form>
          )}

          {/* Step 2 */}
          {!isDone && step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <h2 style={{ marginBottom: 8, fontSize: 22 }}>Check your inbox</h2>
              <p style={{ marginBottom: 24, fontSize: 14 }}>
                Code sent to <strong style={{ color: 'var(--text-primary)' }}>{maskEmail(email)}</strong>
              </p>
              <div style={{ marginBottom: 16 }}>
                <OTPInput value={otp} onChange={setOtp} hasError={!!otpError} />
              </div>
              {otpError && (
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--error)', marginBottom: 12 }}>
                  {otpError}
                </p>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {/* Step 3 */}
          {!isDone && step === 3 && (
            <form onSubmit={handleReset}>
              <h2 style={{ marginBottom: 8, fontSize: 22 }}>New Password</h2>
              <p style={{ marginBottom: 24, fontSize: 14 }}>
                Choose a strong password for your account
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
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                  }} />
                  <input
                    className="input"
                    type={showNew ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ paddingLeft: 44, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowNew(s => !s)}
                    style={{
                      position: 'absolute', right: 14, top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      padding: 0, display: 'flex',
                    }}>
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrengthBar password={newPassword} />
              </div>
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
                    className={`input ${
                      confirmPassword && newPassword !== confirmPassword ? 'error' :
                      confirmPassword && newPassword === confirmPassword ? 'success' : ''
                    }`}
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
                    {confirmPassword && newPassword === confirmPassword && (
                      <span style={{ color: 'var(--success)' }}>✓</span>
                    )}
                    <button type="button" onClick={() => setShowConfirm(s => !s)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 0, display: 'flex',
                      }}>
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
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}