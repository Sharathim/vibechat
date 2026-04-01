import { useState } from 'react'
import { Camera } from 'lucide-react'
import type { User } from '../../types/user'
import { generateUseridSuggestions } from '../../lib/utils'

interface EditProfileFormProps {
  user: User
  onSave: (updates: Partial<User>) => void
  onCancel: () => void
}

export default function EditProfileForm({
  user,
  onSave,
  onCancel,
}: EditProfileFormProps) {
  const [name, setName] = useState(user.name)
  const [userid, setUserid] = useState(user.userid)
  const [bio, setBio] = useState(user.bio)
  const [useridStatus, setUseridStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState('')

  const hasChanges =
    name !== user.name ||
    userid !== user.userid ||
    bio !== user.bio

  const handleUseridChange = (val: string) => {
    setUserid(val)
    setSuggestions([])
    if (!val || val === user.userid) {
      setUseridStatus('idle')
      return
    }
    setUseridStatus('checking')
    setTimeout(() => {
      if (val.toLowerCase() === 'taken') {
        setUseridStatus('taken')
        setSuggestions(generateUseridSuggestions(val))
      } else {
        setUseridStatus('available')
      }
    }, 500)
  }

  const handleSave = () => {
    setError('')
    if (!name.trim() || !/^[a-zA-Z\s]+$/.test(name)) {
      setError('Name must contain alphabets only')
      return
    }
    if (!userid.trim()) {
      setError('Userid cannot be empty')
      return
    }
    if (useridStatus === 'taken') {
      setError('Userid is already taken')
      return
    }
    onSave({ name: name.trim(), userid: userid.trim(), bio: bio.trim() })
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  } as const

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <header style={{
        height: 'var(--header-h)',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        <button
          onClick={onCancel}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontSize: 15, fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Cancel
        </button>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 17, fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          Edit Profile
        </h2>
        <button
          onClick={handleSave}
          disabled={!hasChanges || useridStatus === 'taken'}
          style={{
            background: 'none', border: 'none',
            cursor: hasChanges ? 'pointer' : 'not-allowed',
            color: hasChanges && useridStatus !== 'taken'
              ? 'var(--brand-primary)'
              : 'var(--text-muted)',
            fontSize: 15, fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Save
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Profile picture */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 28,
        }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'var(--brand-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--brand-primary)',
              border: '3px solid var(--brand-border)',
              overflow: 'hidden',
            }}>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user.name[0].toUpperCase()
              )}
            </div>
            <div style={{
              position: 'absolute',
              bottom: 0, right: 0,
              width: 28, height: 28,
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              border: '2px solid var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Camera size={14} color="white" />
            </div>
          </div>
          <button style={{
            marginTop: 10,
            background: 'none', border: 'none',
            color: 'var(--brand-primary)',
            fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Change Photo
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-subtle)',
            border: '1px solid var(--error)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 14, color: 'var(--error)',
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Full Name</label>
          <input
            className="input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            maxLength={50}
          />
          <p style={{
            fontSize: 12, color: 'var(--text-muted)', marginTop: 4,
          }}>
            Alphabets and spaces only
          </p>
        </div>

        {/* Userid */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Userid</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)', fontSize: 15,
            }}>@</span>
            <input
              className={`input ${useridStatus === 'taken' ? 'error' :
                useridStatus === 'available' ? 'success' : ''
                }`}
              type="text"
              value={userid}
              onChange={e => handleUseridChange(e.target.value)}
              style={{ paddingLeft: 32 }}
              maxLength={30}
            />
            {useridStatus === 'available' && (
              <span style={{
                position: 'absolute', right: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--success)',
              }}>✓</span>
            )}
            {useridStatus === 'taken' && (
              <span style={{
                position: 'absolute', right: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--error)',
              }}>✗</span>
            )}
          </div>
          {suggestions.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setUserid(s)
                    setUseridStatus('available')
                    setSuggestions([])
                  }}
                  style={{
                    padding: '4px 12px', borderRadius: 20,
                    border: '1.5px solid var(--brand-primary)',
                    background: 'transparent',
                    color: 'var(--brand-primary)',
                    fontSize: 13, cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Bio</label>
          <div style={{ position: 'relative' }}>
            <textarea
              className="input"
              value={bio}
              onChange={e => {
                if (e.target.value.length <= 80) setBio(e.target.value)
              }}
              placeholder="Tell people about yourself..."
              maxLength={80}
              rows={3}
              style={{
                height: 'auto',
                paddingTop: 12,
                paddingBottom: 12,
                resize: 'none',
                lineHeight: 1.5,
              }}
            />
            <span style={{
              position: 'absolute', right: 12, bottom: 10,
              fontSize: 11, color: bio.length > 70
                ? 'var(--warning)'
                : 'var(--text-muted)',
            }}>
              {bio.length}/80
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}