import { createContext, useContext, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

interface SocketContextType {
	socket: any
	isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
	const socketRef = useRef<any>(null)
	const { isLoggedIn } = useAuth()

	// Socket.IO will be connected in Module 19 (Chat backend)
	// For now this is a mock provider

	return (
		<SocketContext.Provider value={{
			socket: socketRef.current,
			isConnected: false,
		}}>
			{children}
		</SocketContext.Provider>
	)
}

export function useSocket() {
	return useContext(SocketContext)
}
