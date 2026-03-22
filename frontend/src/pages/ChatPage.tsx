import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Edit, Search, X, MessageCircle } from 'lucide-react'
import ConversationItem from '../components/chat/ConversationItem'
import { mockConversations, mockUsers } from '../data/mockData'
import type { Conversation } from '../types/chat'
import { Outlet } from 'react-router-dom'
import chatApi from '../api/chat'

export default function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await chatApi.getConversations()
        setConversations(res.data.conversations || [])
      } catch (err) {
        console.error('Failed to load conversations:', err)
        // Fall back to mock data in development
        setConversations(mockConversations)
      }
    }
    fetchConversations()
  }, [])

  const isConversationOpen = location.pathname !== '/chat'

  const filtered = conversations.filter(c => {
    const q = searchQuery.toLowerCase()
    return (
      c.user.name.toLowerCase().includes(q) ||
      c.user.username.toLowerCase().includes(q)
    )
  })

  // Non-chatted followers for search
  const chattedIds = new Set(conversations.map(c => c.user.id))
  const nonChatted = mockUsers
    .filter(u => !chattedIds.has(u.id))
    .filter(u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    )

  return (
    <>
      {/* Mobile: show list OR conversation */}
      <div className="mobile-only" style={{
        height: '100%',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {isConversationOpen ? (
          <Outlet />
        ) : (
          <ChatList
            filtered={filtered}
            nonChatted={nonChatted}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            navigate={navigate}
          />
        )}
      </div>

      {/* Desktop: side-by-side */}
      <div className="desktop-only" style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Left panel */}
        <div style={{
          width: 360,
          flexShrink: 0,
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          background: 'var(--bg-elevated)',
        }}>
          <ChatList
            filtered={filtered}
            nonChatted={nonChatted}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            navigate={navigate}
          />
        </div>

        {/* Right panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          background: 'var(--bg-primary)',
        }}>
          {isConversationOpen ? (
            <Outlet />
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: 'var(--text-muted)',
            }}>
              <MessageCircle
                size={56}
                style={{ opacity: 0.2 }}
              />
              <p style={{ fontSize: 16, fontWeight: 500 }}>
                Select a conversation
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Choose from your messages on the left
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  )
}

function ChatList({
  filtered,
  nonChatted,
  searchQuery,
  setSearchQuery,
  navigate,
}: {
  filtered: Conversation[]
  nonChatted: typeof mockUsers
  searchQuery: string
  setSearchQuery: (q: string) => void
  navigate: (path: string) => void
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <header style={{
        height: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
      }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          Messages
        </h1>
        <button style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          display: 'flex',
          padding: 4,
        }}>
          <Edit size={20} />
        </button>
      </header>

      {/* Search */}
      <div style={{ padding: '12px 16px', flexShrink: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-tertiary)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 12,
          padding: '0 12px',
          height: 44,
          gap: 8,
          transition: 'border-color 0.2s',
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: 'var(--text-primary)',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Existing conversations */}
        {filtered.map(conv => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
          />
        ))}

        {/* Non-chatted followers (search only) */}
        {searchQuery && nonChatted.length > 0 && (
          <>
            <div style={{
              padding: '12px 16px 4px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              Start a conversation
            </div>
            {nonChatted.map(user => (
              <div
                key={user.id}
                onClick={() => navigate(`/chat/new-${user.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderRadius: 12,
                  margin: '0 8px',
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
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--brand-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  flexShrink: 0,
                }}>
                  {user.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}>
                    {user.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                  }}>
                    Start a conversation
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {filtered.length === 0 && !searchQuery && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 24px',
            textAlign: 'center',
          }}>
            <MessageCircle
              size={48}
              style={{
                color: 'var(--border-color)',
                marginBottom: 16,
              }}
            />
            <h3 style={{ marginBottom: 8 }}>No conversations yet</h3>
            <p style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              marginBottom: 24,
              lineHeight: 1.5,
            }}>
              Start chatting with people who share your music taste
            </p>
            <button
              onClick={() => navigate('/search')}
              className="btn btn-primary"
              style={{ height: 44, fontSize: 14 }}
            >
              Find Friends
            </button>
          </div>
        )}
      </div>
    </div>
  )
}