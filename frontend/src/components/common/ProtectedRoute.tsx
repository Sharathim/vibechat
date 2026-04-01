import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { isLoggedIn, isAuthLoading } = useAuth()
	if (isAuthLoading) {
		return (
			<div style={{
				height: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: 'var(--text-muted)',
			}}>
				Checking session...
			</div>
		)
	}
	if (!isLoggedIn) return <Navigate to="/login" replace />
	return <>{children}</>
}
