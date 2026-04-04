import { createContext, useContext, useState, useRef, useEffect } from 'react'
import musicApi from '../api/music'
import { API_BASE_URL } from '../config'

interface Song {
  id: number
  youtubeId?: string
  youtube_id?: string
  title: string
  artist: string
  thumbnailUrl: string
  thumbnail_url?: string
  audioUrl: string | null
  s3_audio_url?: string | null
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

  useEffect(() => {
    audioRef.current = new Audio()

    audioRef.current.addEventListener('ended', () => {
      skipToNext()
    })

    audioRef.current.addEventListener('timeupdate', () => {
      const audio = audioRef.current
      if (audio && audio.duration) {
        setProgressState((audio.currentTime / audio.duration) * 100)
      }
    })

    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const loadAndPlay = async (song: Song) => {
    const audio = audioRef.current
    if (!audio) return

    try {
      // Build stream URL through our backend proxy
      const youtubeId = song.youtubeId || song.id.toString()
      const streamUrl = `${API_BASE_URL}/api/music/stream/${youtubeId}`

      audio.src = streamUrl
      audio.load()
      await audio.play()
      setIsPlaying(true)

      // Log to history
      try {
        await musicApi.logPlay(song.id)
      } catch (e) {
        // Non-critical
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