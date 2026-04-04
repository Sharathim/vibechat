import { createContext, useContext, useState, useRef, useEffect } from 'react'
import musicApi from '../api/music'
import { API_BASE_URL } from '../config'
import type { Song } from '../types/song'

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

  useEffect(() => {
    audioRef.current = new Audio()

    const handleEnded = () => skipToNext()
    const handleTimeUpdate = () => {
      const audio = audioRef.current
      if (audio && audio.duration) {
        setProgressState((audio.currentTime / audio.duration) * 100)
      }
    }

    audioRef.current.addEventListener('ended', handleEnded)
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [])

  const loadAndPlay = async (song: Song) => {
    const audio = audioRef.current
    if (!audio) return

    try {
      // Stream URL uses the song's YouTube ID
      const streamUrl = `${API_BASE_URL}/api/music/stream/${song.youtubeId}`

      audio.src = streamUrl
      audio.load()
      await audio.play()
      setIsPlaying(true)

      // Log to history using youtubeId
      try {
        await musicApi.logPlay(song.youtubeId)
      } catch (e) {
        console.warn('Failed to log play history:', e)
      }
    } catch (err) {
      console.error('Playback error:', err)
      setIsPlaying(false)
    }
  }

  const play = (song: Song) => {
    setCurrentSong(song)
    setProgressState(0)
    loadAndPlay(song)
  }

  const pause = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }

  const resume = () => {
    audioRef.current?.play()
    setIsPlaying(true)
  }

  const skipToNext = () => {
    if (queue.length === 0) {
      setIsPlaying(false)
      setCurrentSong(null)
      return
    }
    const [next, ...rest] = queue
    setQueue(rest)
    play(next)
  }

  const skip = () => skipToNext()

  const previous = () => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
    }
  }

  const addToQueue = (song: Song) => {
    setQueue(prev => [...prev, song])
  }

  const setProgress = (value: number) => {
    const audio = audioRef.current
    if (audio && audio.duration) {
      audio.currentTime = (value / 100) * audio.duration
    }
    setProgressState(value)
  }

  return (
    <MusicContext.Provider value={{
      currentSong, isPlaying, progress, queue,
      play, pause, resume, skip, previous,
      addToQueue, setProgress,
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