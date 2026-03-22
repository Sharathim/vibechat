import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	User, Lock, Bell, Palette,
	HelpCircle, LogOut, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import authApi from '../../api/auth'

const settingsItems = [
	{
		icon: User,
		label: 'Account',
		subtitle: 'Manage your account details',
		path: '/settings/account',
		color: 'var(--brand-primary)',
	},
	{
		icon: Lock,
		label: 'Privacy',
		subtitle: 'Control your privacy settings',
		path: '/settings/privacy',
		color: 'var(--accent)',
	},
	{
		icon: Bell,
		label: 'Notifications',
		subtitle: 'Configure notification preferences',
		path: '/settings/notifications',
		color: 'var(--warning)',
	},
	{
		icon: Palette,
		label: 'Appearance',
		subtitle: 'Customize the app look',
		path: '/settings/appearance',
		color: 'var(--success)',
	},
	{
		icon: HelpCircle,
		label: 'Help & Support',
		subtitle: 'Get help and contact us',
		path: '/settings/help',
		color: 'var(--text-secondary)',
	},
]

export default function SettingsPage() {
	const navigate = useNavigate()
	const { logout } = useAuth()
	const [showLogoutConfirm, setShowLogoutConfirm] =
		useState(false)

	const handleLogout = async () => {
		try {
			await authApi.logout()
		} catch (err) {
			console.error('Logout error:', err)
		} finally {
			logout()
			navigate('/login')
		}
	}

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
				padding: '0 16px',
				gap: 12,
				flexShrink: 0,
			}}>
				<button
					onClick={() => navigate('/profile')}
					style={{
						background: 'none', border: 'none',
						cursor: 'pointer', color: 'var(--text-secondary)',
						fontSize: 20, display: 'flex', padding: 4,
					}}
				>
					↩
				</button>
				<h1 style={{
					fontFamily: 'Syne, sans-serif',
					fontSize: 20, fontWeight: 700,
					color: 'var(--text-primary)',
				}}>
					Settings
				</h1>
			</header>

			<div style={{ flex: 1, overflowY: 'auto' }}>
				{/* Settings rows */}
				<div style={{ padding: '8px 0' }}>
					{settingsItems.map(({ icon: Icon, label, subtitle, path, color }) => (
						<div
							key={path}
							onClick={() => navigate(path)}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 14,
								padding: '14px 16px',
								cursor: 'pointer',
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
							<div style={{
								width: 42,
								height: 42,
								borderRadius: 12,
								background: 'var(--brand-subtle)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}>
								<Icon size={20} style={{ color }} />
							</div>
							<div style={{ flex: 1 }}>
								<div style={{
									fontSize: 15,
									fontWeight: 600,
									color: 'var(--text-primary)',
									marginBottom: 2,
								}}>
									{label}
								</div>
								<div style={{
									fontSize: 13,
									color: 'var(--text-muted)',
								}}>
									{subtitle}
								</div>
							</div>
							<ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
						</div>
					))}
				</div>

				{/* Logout button */}
				<div style={{ padding: '24px 16px 8px' }}>
					<button
						onClick={() => setShowLogoutConfirm(true)}
						style={{
							width: '100%',
							height: 52,
							borderRadius: 14,
							background: 'var(--error-subtle)',
							border: '1px solid var(--error)',
							color: 'var(--error)',
							fontSize: 15,
							fontWeight: 600,
							cursor: 'pointer',
							fontFamily: 'DM Sans, sans-serif',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 8,
							transition: 'all 0.2s',
						}}
						onMouseEnter={e => {
							e.currentTarget.style.background = '#fca5a5'
						}}
						onMouseLeave={e => {
							e.currentTarget.style.background = 'var(--error-subtle)'
						}}
					>
						<LogOut size={18} />
						Log Out
					</button>
				</div>

				{/* Version */}
				<p style={{
					textAlign: 'center',
					fontSize: 13,
					color: 'var(--text-muted)',
					padding: '8px 0 24px',
				}}>
					VibeChat v1.0.0
				</p>
			</div>

			{/* Logout confirmation dialog */}
			{showLogoutConfirm && (
				<>
					<div
						onClick={() => setShowLogoutConfirm(false)}
						style={{
							position: 'fixed', inset: 0,
							background: 'var(--overlay)',
							zIndex: 100,
						}}
					/>
					<div style={{
						position: 'fixed',
						top: '50%', left: '50%',
						transform: 'translate(-50%, -50%)',
						background: 'var(--bg-elevated)',
						border: '1px solid var(--border-color)',
						borderRadius: 20,
						padding: 24,
						width: 'min(320px, 90vw)',
						zIndex: 101,
						animation: 'scaleIn 0.2s ease',
					}}>
						<h3 style={{
							fontFamily: 'Syne, sans-serif',
							fontSize: 18, fontWeight: 700,
							marginBottom: 8,
							color: 'var(--text-primary)',
						}}>
							Log out of VibeChat?
						</h3>
						<p style={{
							fontSize: 14,
							color: 'var(--text-secondary)',
							marginBottom: 24,
							lineHeight: 1.5,
						}}>
							You will need to log in again to access your account.
						</p>
						<div style={{ display: 'flex', gap: 10 }}>
							<button
								onClick={() => setShowLogoutConfirm(false)}
								className="btn btn-ghost"
								style={{ flex: 1, height: 44, fontSize: 14 }}
							>
								Cancel
							</button>
							<button
								onClick={handleLogout}
								className="btn btn-danger"
								style={{ flex: 1, height: 44, fontSize: 14 }}
							>
								Log Out
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	)
}
