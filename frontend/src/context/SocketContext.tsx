import {
  createContext, useContext,
  useEffect, useRef, useState
} from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { SOCKET_URL } from '../config'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export function SocketProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isLoggedIn, user } = useAuth()

  useEffect(() => {
    if (!isLoggedIn || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setIsConnected(false)
      }
      return
    }

    // Connect to backend
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['polling'],
      upgrade: false,
    })

    socket.on('connect', () => {
      setIsConnected(true)
      // Tell server who we are
      socket.emit('user_online', { user_id: user.id })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
      setIsConnected(false)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [isLoggedIn, user?.id])

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}