import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronRight, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import PasswordStrengthBar from '../../components/auth/PasswordStrengthBar'

type SubScreen = 'main' | 'name' | 'username' | 'password' | 'email' | 'delete'

export default function AccountSettingsPage() {
	const navigate = useNavigate()
	const { user, updateUser, logout } = useAuth()
	const [screen, setScreen] = useState<SubScreen>('main')

	const accountItems = [
		{ label: 'Change Name', screen: 'name' as SubScreen },
		{ label: 'Change Username', screen: 'username' as SubScreen },
		{ label: 'Change Password', screen: 'password' as SubScreen },
		{ label: 'Change Email', screen: 'email' as SubScreen },
	]

	if (screen === 'name') {
		return <ChangeNameScreen
			current={user?.name || ''}
			onBack={() => setScreen('main')}
			onSave={(name) => { updateUser({ name }); setScreen('main') }}
		/>
	}

	if (screen === 'username') {
		return <ChangeUsernameScreen
			current={user?.username || ''}
			onBack={() => setScreen('main')}
			onSave={(username) => { updateUser({ username }); setScreen('main') }}
		/>
	}

	if (screen === 'password') {
		return <ChangePasswordScreen
			onBack={() => setScreen('main')}
		/>
	}

	if (screen === 'email') {
		return <ChangeEmailScreen
			current={user?.email || ''}
			onBack={() => setScreen('main')}
		/>
	}

	if (screen === 'delete') {
		return <DeleteAccountScreen
			onBack={() => setScreen('main')}
			onDelete={() => { logout(); navigate('/login') }}
		/>
	}

	return (
		<div style={{
			display: 'flex', flexDirection: 'column',
			height: '100%', background: 'var(--bg-primary)',
			overflow: 'hidden',
		}}>
			<header style={{
				height: 'var(--header-h)',
				background: 'var(--bg-elevated)',
				borderBottom: '1px solid var(--border-color)',
				display: 'flex', alignItems: 'center',
				padding: '0 16px', gap: 12, flexShrink: 0,
			}}>
				<button onClick={() => navigate('/settings')}
					style={{
						background: 'none', border: 'none', cursor: 'pointer',
						color: 'var(--text-secondary)', fontSize: 20,
					}}>↩</button>
				<h1 style={{
					fontFamily: 'Syne, sans-serif', fontSize: 20,
					fontWeight: 700, color: 'var(--text-primary)',
				}}>Account</h1>
			</header>

			<div style={{ flex: 1, overflowY: 'auto' }}>
				{accountItems.map(({ label, screen: s }) => (
					<div
						key={label}
						onClick={() => setScreen(s)}
						style={{
							display: 'flex', alignItems: 'center',
							padding: '16px', cursor: 'pointer',
							borderBottom: '1px solid var(--border-subtle)',
							transition: 'background 0.15s',
						}}
						onMouseEnter={e =>
							e.currentTarget.style.background = 'var(--bg-tertiary)'
						}
						onMouseLeave={e =>
							e.currentTarget.style.background = 'transparent'
						}
					>
						<span style={{
							flex: 1, fontSize: 15,
							color: 'var(--text-primary)',
						}}>{label}</span>
						<ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
					</div>
				))}

				<div style={{ padding: '24px 16px' }}>
					<button
						onClick={() => setScreen('delete')}
						style={{
							width: '100%', padding: '14px 16px',
							background: 'none', border: 'none',
							borderRadius: 12, cursor: 'pointer',
							color: 'var(--error)', fontSize: 15,
							fontWeight: 500, textAlign: 'left',
							fontFamily: 'DM Sans, sans-serif',
							display: 'flex', alignItems: 'center', gap: 10,
							transition: 'background 0.15s',
						}}
						onMouseEnter={e =>
							e.currentTarget.style.background = 'var(--error-subtle)'
						}
						onMouseLeave={e =>
							e.currentTarget.style.background = 'none'
						}
					>
						<AlertTriangle size={18} />
						Delete Account
					</button>
				</div>
			</div>
		</div>
	)
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
	return (
		<header style={{
			height: 'var(--header-h)',
			background: 'var(--bg-elevated)',
			borderBottom: '1px solid var(--border-color)',
			display: 'flex', alignItems: 'center',
			padding: '0 16px', gap: 12, flexShrink: 0,
		}}>
			<button onClick={onBack} style={{
				background: 'none', border: 'none',
				cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 20,
			}}>↩</button>
			<h2 style={{
				fontFamily: 'Syne, sans-serif', fontSize: 18,
				fontWeight: 700, color: 'var(--text-primary)',
			}}>{title}</h2>
		</header>
	)
}

function ChangeNameScreen({
	current, onBack, onSave,
}: { current: string; onBack: () => void; onSave: (v: string) => void }) {
	const [name, setName] = useState(current)
	const [error, setError] = useState('')

	const handleSave = () => {
		if (!name.trim() || !/^[a-zA-Z\s]+$/.test(name)) {
			setError('Name must contain alphabets only')
			return
		}
		onSave(name.trim())
	}

	return (
		<div style={{
			display: 'flex', flexDirection: 'column',
			height: '100%', background: 'var(--bg-primary)', overflow: 'hidden',
		}}>
			<header style={{
				height: 'var(--header-h)',
				background: 'var(--bg-elevated)',
				borderBottom: '1px solid var(--border-color)',
				display: 'flex', alignItems: 'center',
				justifyContent: 'space-between',
				padding: '0 16px', flexShrink: 0,
			}}>
				<button onClick={onBack} style={{
					background: 'none', border: 'none',
					cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 15,
					fontFamily: 'DM Sans, sans-serif',
				}}>Cancel</button>
				<h2 style={{
					fontFamily: 'Syne, sans-serif', fontSize: 17,
					fontWeight: 700, color: 'var(--text-primary)',
				}}>Change Name</h2>
				<button onClick={handleSave} style={{
					background: 'none', border: 'none',
					cursor: 'pointer', color: 'var(--brand-primary)',
					fontSize: 15, fontWeight: 600,
					fontFamily: 'DM Sans, sans-serif',
				}}>Save</button>
			</header>
			<div style={{ padding: 20 }}>
				{error && (
					<div style={{
						background: 'var(--error-subtle)',
						border: '1px solid var(--error)',
						borderRadius: 10, padding: '10px 14px',
						fontSize: 14, color: 'var(--error)', marginBottom: 16,
					}}>{error}</div>
				)}
				<label style={{
					display: 'block', fontSize: 13, fontWeight: 600,
					color: 'var(--text-secondary)', marginBottom: 6,
				}}>Full Name</label>
				<input
					className="input"
					type="text"
					value={name}
					onChange={e => { setName(e.target.value); setError('') }}
					placeholder="Your full name"
					maxLength={50}
					autoFocus
				/>
				<p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
					Alphabets and spaces only
				</p>
			</div>
		</div>
	)
}

function ChangeUsernameScreen({
	current, onBack, onSave,
}: { current: string; onBack: () => void; onSave: (v: string) => void }) {
	const [username, setUsername] = useState(current)
	const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

	const handleChange = (val: string) => {
		setUsername(val)
		if (!val || val === current) { setStatus('idle'); return }
		setStatus('checking')
		setTimeout(() => {
			setStatus(val.toLowerCase() === 'taken' ? 'taken' : 'available')
		}, 500)
	}

	return (
		<div style={{
			display: 'flex', flexDirection: 'column',
			height: '100%', background: 'var(--bg-primary)', overflow: 'hidden',
		}}>
			<header style={{
				height: 'var(--header-h)',
				background: 'var(--bg-elevated)',
				borderBottom: '1px solid var(--border-color)',
				display: 'flex', alignItems: 'center',
				justifyContent: 'space-between',
				padding: '0 16px', flexShrink: 0,
			}}>
				<button onClick={onBack} style={{
					background: 'none', border: 'none', cursor: 'pointer',
					color: 'var(--text-secondary)', fontSize: 15,
					fontFamily: 'DM Sans, sans-serif',
				}}>Cancel</button>
				<h2 style={{
					fontFamily: 'Syne, sans-serif', fontSize: 17,
					fontWeight: 700, color: 'var(--text-primary)',
				}}>Change Username</h2>
				<button
					onClick={() => status !== 'taken' && onSave(username)}
					disabled={status === 'taken' || !username}
					style={{
						background: 'none', border: 'none',
						cursor: status === 'taken' ? 'not-allowed' : 'pointer',
						color: status === 'taken'
							? 'var(--text-muted)'
							: 'var(--brand-primary)',
						fontSize: 15, fontWeight: 600,
						fontFamily: 'DM Sans, sans-serif',
					}}>Save</button>
			</header>
			<div style={{ padding: 20 }}>
				<label style={{
					display: 'block', fontSize: 13, fontWeight: 600,
					color: 'var(--text-secondary)', marginBottom: 6,
				}}>Username</label>
				<div style={{ position: 'relative' }}>
					<span style={{
						position: 'absolute', left: 14, top: '50%',
						transform: 'translateY(-50%)',
						color: 'var(--text-muted)', fontSize: 15,
					}}>@</span>
					<input
						className={`input ${status === 'taken' ? 'error' : status === 'available' ? 'success' : ''}`}
						type="text"
						value={username}
						onChange={e => handleChange(e.target.value)}
						style={{ paddingLeft: 32 }}
						maxLength={30}
						autoFocus
					/>
					{status === 'available' && (
						<span style={{
							position: 'absolute', right: 14, top: '50%',
							transform: 'translateY(-50%)', color: 'var(--success)',
						}}>✓</span>
					)}
					{status === 'taken' && (
						<span style={{
							position: 'absolute', right: 14, top: '50%',
							transform: 'translateY(-50%)', color: 'var(--error)',
						}}>✗</span>
					)}
				</div>
				{status === 'available' && (
					<p style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>
						Username is available
					</p>
				)}
				{status === 'taken' && (
					<p style={{ fontSize: 12, color: 'var(--error)', marginTop: 6 }}>
						Username already taken
					</p>
				)}
			</div>
		</div>
	)
}

function ChangePasswordScreen({ onBack }: { onBack: () => void }) {
	const [current, setCurrent] = useState('')
	const [newPass, setNewPass] = useState('')
	const [confirm, setConfirm] = useState('')
	const [showCurrent, setShowCurrent] = useState(false)
	const [showNew, setShowNew] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState(false)

	const handleSave = () => {
		if (!current) { setError('Enter your current password'); return }
		if (newPass.length < 8) { setError('New password must be at least 8 characters'); return }
		if (newPass === current) { setError('New password cannot be same as current'); return }
		if (newPass !== confirm) { setError('Passwords do not match'); return }
		setSuccess(true)
		setTimeout(onBack, 1500)
	}

	return (
		<div style={{
			display: 'flex', flexDirection: 'column',
			height: '100%', background: 'var(--bg-primary)', overflow: 'hidden',
		}}>
			<header style={{
				height: 'var(--header-h)',
				background: 'var(--bg-elevated)',
				borderBottom: '1px solid var(--border-color)',
				display: 'flex', alignItems: 'center',
				justifyContent: 'space-between',
				padding: '0 16px', flexShrink: 0,
			}}>
				<button onClick={onBack} style={{
					background: 'none', border: 'none', cursor: 'pointer',
					color: 'var(--text-secondary)', fontSize: 15,
					fontFamily: 'DM Sans, sans-serif',
				}}>Cancel</button>
				<h2 style={{
					fontFamily: 'Syne, sans-serif', fontSize: 17,
					fontWeight: 700, color: 'var(--text-primary)',
				}}>Change Password</h2>
				<button onClick={handleSave} style={{
					background: 'none', border: 'none', cursor: 'pointer',
					color: 'var(--brand-primary)', fontSize: 15, fontWeight: 600,
					fontFamily: 'DM Sans, sans-serif',
				}}>Save</button>
			</header>
			<div style={{ padding: 20 }}>
				{error && (
					<div style={{
						background: 'var(--error-subtle)', border: '1px solid var(--error)',
						borderRadius: 10, padding: '10px 14px',
						fontSize: 14, color: 'var(--error)', marginBottom: 16,
					}}>{error}</div>
				)}
				{success && (
					<div style={{
						background: 'var(--success-subtle)', border: '1px solid var(--success)',
						borderRadius: 10, padding: '10px 14px',
						fontSize: 14, color: 'var(--success)', marginBottom: 16,
					}}>Password changed successfully!</div>
				)}

				{[
					{ label: 'Current Password', val: current, set: setCurrent, show: showCurrent, setShow: setShowCurrent },
					{ label: 'New Password', val: newPass, set: setNewPass, show: showNew, setShow: setShowNew },
					{ label: 'Confirm New Password', val: confirm, set: setConfirm, show: showConfirm, setShow: setShowConfirm },
				].map(({ label, val, set, show, setShow }) => (
					<div key={label} style={{ marginBottom: 16 }}>
						<label style={{
							display: 'block', fontSize: 13, fontWeight: 600,
							color: 'var(--text-secondary)', marginBottom: 6,
						}}>{label}</label>
						<div style={{ position: 'relative' }}>
							<input
								className="input"
								type={show ? 'text' : 'password'}
								value={val}
								onChange={e => { set(e.target.value); setError('') }}
								placeholder="••••••••"
								style={{ paddingRight: 44 }}
							/>
							<button
								type="button"
								onClick={() => setShow((s: boolean) => !s)}
								style={{
									position: 'absolute', right: 14, top: '50%',
									transform: 'translateY(-50%)',
									background: 'none', border: 'none', cursor: 'pointer',
									color: 'var(--text-muted)', display: 'flex',
								}}
							>
								{show ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
						{label === 'New Password' && (
							<PasswordStrengthBar password={val} />
						)}
					</div>
				))}
			</div>
		</div>
	)
}

function ChangeEmailScreen({
	current, onBack,
}: { current: string; onBack: () => void }) {
	const [email, setEmail] = useState('')
	const [otpSent, setOtpSent] = useState(false)
	const [otp, setOtp] = useState('')
	const [success, setSuccess] = useState(false)

	return (
		<div style={{
			display: 'flex', flexDirection: 'column',
			height: '100%', background: 'var(--bg-primary)', overflow: 'hidden',
		}}>
			<SubHeader title="Change Email" onBack={onBack} />
			<div style={{ padding: 20 }}>
				<div style={{
					background: 'var(--bg-tertiary)', borderRadius: 10,
					padding: '12px 14px', marginBottom: 20,
					fontSize: 14, color: 'var(--text-secondary)',
				}}>
					Current email: <strong style={{ color: 'var(--text-primary)' }}>
						{current.slice(0, 3)}****{current.slice(current.indexOf('@'))}
					</strong>
				</div>

				{success ? (
					<div style={{
						background: 'var(--success-subtle)', border: '1px solid var(--success)',
						borderRadius: 10, padding: '12px 14px',
						fontSize: 14, color: 'var(--success)',
					}}>
						✓ Email updated successfully!
					</div>
				) : !otpSent ? (
					<>
						<label style={{
							display: 'block', fontSize: 13, fontWeight: 600,
							color: 'var(--text-secondary)', marginBottom: 6,
						}}>New Gmail Address</label>
						<input
							className="input"
							type="email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							placeholder="newmail@gmail.com"
							style={{ marginBottom: 16 }}
						/>
						<button
							onClick={() => email && setOtpSent(true)}
							className="btn btn-primary btn-full"
						>
							Send OTP
						</button>
					</>
				) : (
					<>
						<p style={{
							fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16,
						}}>
							Enter the OTP sent to <strong>{email}</strong>
						</p>
						<input
							className="input"
							type="text"
							value={otp}
							onChange={e => setOtp(e.target.value)}
							placeholder="6-digit code"
							maxLength={6}
							style={{ marginBottom: 16 }}
						/>
						<button
							onClick={() => otp.length === 6 && setSuccess(true)}
							className="btn btn-primary btn-full"
						>
							Verify & Update
						</button>
					</>
				)}
			</div>
		</div>
	)
}

function DeleteAccountScreen({
	onBack, onDelete,
}: { onBack: () => void; onDelete: () => void }) {
	const [password, setPassword] = useState('')
	const [confirmed, setConfirmed] = useState(false)

	return (
		<div style={{
			display: 'flex', flexDirection: 'column',
			height: '100%', background: 'var(--bg-primary)', overflow: 'hidden',
		}}>
			<SubHeader title="Delete Account" onBack={onBack} />
			<div style={{ padding: 20 }}>
				<div style={{
					background: 'var(--error-subtle)', border: '1px solid var(--error)',
					borderRadius: 14, padding: 16, marginBottom: 24,
				}}>
					<div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
						<AlertTriangle size={20} style={{ color: 'var(--error)', flexShrink: 0 }} />
						<strong style={{ color: 'var(--error)', fontSize: 15 }}>
							This action is permanent
						</strong>
					</div>
					{[
						'Remove your profile permanently',
						'Delete all your messages',
						'Remove you from all followers and following lists',
						'Delete all your playlists',
						'Delete your listening history',
					].map(item => (
						<div key={item} style={{
							fontSize: 13, color: 'var(--text-secondary)',
							paddingLeft: 30, marginBottom: 6,
						}}>
							• {item}
						</div>
					))}
				</div>

				<label style={{
					display: 'block', fontSize: 13, fontWeight: 600,
					color: 'var(--text-secondary)', marginBottom: 6,
				}}>
					Enter your password to confirm
				</label>
				<input
					className="input"
					type="password"
					value={password}
					onChange={e => setPassword(e.target.value)}
					placeholder="Your password"
					style={{ marginBottom: 16 }}
				/>

				{!confirmed ? (
					<button
						onClick={() => password && setConfirmed(true)}
						disabled={!password}
						className="btn btn-danger btn-full"
					>
						Delete My Account
					</button>
				) : (
					<div style={{
						background: 'var(--error-subtle)',
						border: '1px solid var(--error)',
						borderRadius: 14, padding: 20,
						textAlign: 'center',
					}}>
						<p style={{
							fontSize: 15, fontWeight: 600,
							color: 'var(--text-primary)', marginBottom: 8,
						}}>
							Are you absolutely sure?
						</p>
						<p style={{
							fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20,
						}}>
							This cannot be undone.
						</p>
						<div style={{ display: 'flex', gap: 10 }}>
							<button
								onClick={() => setConfirmed(false)}
								className="btn btn-ghost"
								style={{ flex: 1, height: 44, fontSize: 14 }}
							>
								Cancel
							</button>
							<button
								onClick={onDelete}
								className="btn btn-danger"
								style={{ flex: 1, height: 44, fontSize: 14 }}
							>
								Yes, Delete
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
