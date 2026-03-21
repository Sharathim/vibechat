import { createContext, useContext, useState, useRef } from 'react'

interface Song {
	id: number
	title: string
	artist: string
	thumbnailUrl: string
	audioUrl: string | null
	duration: number
}

interface MusicContextType {
	currentSong: Song | null
	isPlaying: boolean
	progress: number
	queue: Song[]
	play: (song: Song) => void
	pause: () => void
	resume: () => void
	skip: () => void
	previous: () => void
	addToQueue: (song: Song) => void
	setProgress: (value: number) => void
}

const MusicContext = createContext<MusicContextType | null>(null)

export function MusicProvider({ children }: { children: React.ReactNode }) {
	const [currentSong, setCurrentSong] = useState<Song | null>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [progress, setProgressState] = useState(0)
	const [queue, setQueue] = useState<Song[]>([])
	const audioRef = useRef<HTMLAudioElement | null>(null)

	const play = (song: Song) => {
		setCurrentSong(song)
		setIsPlaying(true)
		setProgressState(0)
	}

	const pause = () => setIsPlaying(false)
	const resume = () => setIsPlaying(true)

	const skip = () => {
		if (queue.length === 0) return
		const [next, ...rest] = queue
		setQueue(rest)
		play(next)
	}

	const previous = () => {}

	const addToQueue = (song: Song) => {
		setQueue(prev => [...prev, song])
	}

	const setProgress = (value: number) => setProgressState(value)

	return (
		<MusicContext.Provider value={{
			currentSong, isPlaying, progress, queue,
			play, pause, resume, skip, previous,
			addToQueue, setProgress
		}}>
			{children}
		</MusicContext.Provider>
	)
}

export function useMusic() {
	const ctx = useContext(MusicContext)
	if (!ctx) throw new Error('useMusic must be used inside MusicProvider')
	return ctx
}
