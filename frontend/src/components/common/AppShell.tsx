import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import MiniPlayer from './MiniPlayer'
import FloatingVibeIcon from './FloatingVibeIcon'
import VibeSession from '../vibe/VibeSession'
import { useVibe } from '../../context/VibeContext'

export default function AppShell() {
	const location = useLocation()
	const { isActive, isMinimized } = useVibe()
	const isConversation = /^\/chat\/.+/.test(location.pathname)

	return (
		<div style={{
			display: 'flex',
			height: '100vh',
			overflow: 'hidden',
		}}>
			<Sidebar />

			<div style={{
				flex: 1,
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				minWidth: 0,
			}}>
				<div style={{
					flex: 1,
					overflow: 'hidden',
					position: 'relative',
				}}>
					<Outlet />
				</div>

				{/* MiniPlayer hidden inside conversation 
						because ConversationPage renders it internally */}
				{!isConversation && <MiniPlayer />}

				{/* Bottom nav hidden during conversation */}
				{!isConversation && <BottomNav />}
			</div>

			<FloatingVibeIcon />

			{/* Vibe session renders fullscreen when active and not minimized */}
			{isActive && !isMinimized && <VibeSession />}
		</div>
	)
}
