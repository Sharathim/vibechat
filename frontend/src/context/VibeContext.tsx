import { createContext, useContext, useState } from 'react'

interface VibeSong {
	id: number
	title: string
	artist: string
	thumbnailUrl: string
}

interface VibeSession {
	id: string
	partnerName: string
	partnerAvatar: string | null
	isCoHost: boolean
	isHost: boolean
	queue: VibeSong[]
	currentSong: VibeSong | null
	isPlaying: boolean
	progress: number
}

interface VibeContextType {
	isActive: boolean
	session: VibeSession | null
	startSession: (session: VibeSession) => void
	endSession: () => void
	addSong: (song: VibeSong) => void
	removeSong: (songId: number) => void
	isMinimized: boolean
	minimize: () => void
	expand: () => void
}

const VibeContext = createContext<VibeContextType | null>(null)

export function VibeProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<VibeSession | null>(null)
	const [isMinimized, setIsMinimized] = useState(false)

	const startSession = (s: VibeSession) => {
		setSession(s)
		setIsMinimized(false)
	}

	const endSession = () => {
		setSession(null)
		setIsMinimized(false)
	}

	const addSong = (song: VibeSong) => {
		if (!session) return
		setSession(prev => prev ? {
			...prev,
			queue: [...prev.queue, song]
		} : null)
	}

	const removeSong = (songId: number) => {
		if (!session) return
		setSession(prev => prev ? {
			...prev,
			queue: prev.queue.filter(s => s.id !== songId)
		} : null)
	}

	const minimize = () => setIsMinimized(true)
	const expand = () => setIsMinimized(false)

	return (
		<VibeContext.Provider value={{
			isActive: !!session,
			session,
			startSession,
			endSession,
			addSong,
			removeSong,
			isMinimized,
			minimize,
			expand,
		}}>
			{children}
		</VibeContext.Provider>
	)
}

export function useVibe() {
	const ctx = useContext(VibeContext)
	if (!ctx) throw new Error('useVibe must be used inside VibeProvider')
	return ctx
}
