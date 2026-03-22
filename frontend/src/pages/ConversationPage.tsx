import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Music } from 'lucide-react'
import MessageBubble from '../components/chat/MessageBubble'
import TypingBar from '../components/chat/TypingBar'
import ThreeDotMenu from '../components/chat/ThreeDotMenu'
import Avatar from '../components/common/Avatar'
import MiniPlayer from '../components/common/MiniPlayer'
import { useVibe } from '../context/VibeContext'
import chatApi from '../api/chat'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import type { VibeSessionData } from '../types/vibe'
import { mockConversations, mockSongs } from '../data/mockData'
import type { Message } from '../types/chat'

export default function ConversationPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversation = mockConversations.find(
    c => c.id === Number(conversationId)
  )

  const [messages, setMessages] = useState<Message[]>([])

  const { socket } = useSocket()
  const { user } = useAuth()

  const { startSession, isActive } = useVibe()

  useEffect(() => {
    if (!conversationId) return

    const convId = Number(conversationId)

    const loadMessages = async () => {
      try {
        const res = await chatApi.getMessages(convId)
        setMessages(res.data.messages || [])
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }

    loadMessages()

    // Join socket room
    if (socket) {
      socket.emit('join_conversation', {
        conversation_id: convId
      })

      socket.on('receive_message', (msg: Message) => {
        setMessages(prev => [...prev, msg])
      })

      socket.on('user_typing', (_data: any) => {
        // Handle typing indicator later
      })
    }

    return () => {
      if (socket) {
        socket.emit('leave_conversation', {
          conversation_id: convId
        })
        socket.off('receive_message')
        socket.off('user_typing')
      }
    }
  }, [conversationId, socket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conversation) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
      }}>
        Conversation not found
      </div>
    )
  }

  const handleStartVibe = () => {
    if (isActive) return
    const session: VibeSessionData = {
      id: Date.now().toString(),
      partnerName: conversation.user.name,
      partnerUsername: conversation.user.username,
      partnerAvatar: conversation.user.avatarUrl,
      isCoHost: false,
      isHost: true,
      queue: mockSongs.slice(0, 3).map((s, i) => ({
        ...s,
        addedBy: 'You',
        position: i,
      })),
      currentSong: mockSongs[0],
      isPlaying: false,
      progress: 0,
      startedAt: new Date().toISOString(),
    }
    startSession(session)
  }

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || !conversationId) return
    const convId = Number(conversationId)

    try {
      // Send via socket for real-time
      if (socket && user) {
        socket.emit('send_message', {
          conversation_id: convId,
          sender_id: user.id,
          content: text,
          type: 'text',
        })
      } else {
        // Fallback to REST
        const res = await chatApi.sendMessage(convId, text)
        setMessages(prev => [...prev, res.data.message])
      }
    } catch (err) {
      console.error('Send message error:', err)
    }
  }, [conversationId, socket, user])

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
        padding: '0 12px',
        gap: 8,
        flexShrink: 0,
      }}>
        {/* Custom back button */}
        <button
          onClick={() => navigate('/chat')}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: 20,
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--bg-tertiary)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'none'
          }
        >
          ↩
        </button>

        {/* Avatar + name */}
        <Avatar
          name={conversation.user.name}
          src={conversation.user.avatarUrl}
          size={40}
          showOnline={conversation.isOnline}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {conversation.user.name}
          </div>
          <div style={{
            fontSize: 12,
            color: conversation.isOnline
              ? 'var(--success)'
              : 'var(--text-muted)',
          }}>
            {conversation.isOnline ? 'Active now' : 'Active 1h ago'}
          </div>
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Call */}
          <button style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
            color: 'var(--text-secondary)', transition: 'background 0.2s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--bg-tertiary)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'none'
          }>
            <Phone size={20} />
          </button>

          {/* Vibe */}
          <button style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
            color: 'var(--brand-primary)', transition: 'background 0.2s',
          }}
          onClick={handleStartVibe}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'var(--brand-subtle)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.background = 'none'
          }>
            <Music size={20} />
          </button>

          {/* Three dot */}
          <ThreeDotMenu
            onTurnOffVibe={() => {}}
            onViewVibes={() => {}}
            onRemoveChat={() => navigate('/chat')}
            onClearChat={async () => {
              try {
                await chatApi.clearChat(Number(conversationId))
                setMessages([])
              } catch (err) {
                setMessages([])
              }
            }}
          />
        </div>
      </header>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Date separator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '8px 0',
        }}>
          <div style={{
            flex: 1, height: 1,
            background: 'var(--border-subtle)',
          }} />
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}>
            Today
          </span>
          <div style={{
            flex: 1, height: 1,
            background: 'var(--border-subtle)',
          }} />
        </div>

        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            padding: 24,
            textAlign: 'center',
          }}>
            <Avatar
              name={conversation.user.name}
              src={conversation.user.avatarUrl}
              size={64}
            />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 }}>
              {conversation.user.name}
            </p>
            <p style={{ fontSize: 14 }}>
              Start a conversation — say hi! 👋
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === 1}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MiniPlayer />

      {/* Typing bar */}
      <TypingBar onSend={handleSend} />
    </div>
  )
}