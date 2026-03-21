import { useNavigate } from 'react-router-dom'
import type { Conversation } from '../../types/chat'
import Avatar from '../common/Avatar'

interface ConversationItemProps {
  conversation: Conversation
  isActive?: boolean
}

export default function ConversationItem({
  conversation,
  isActive = false,
}: ConversationItemProps) {
  const navigate = useNavigate()

  const getLastMessagePreview = () => {
    if (conversation.lastMessageType === 'song') {
      return `🎵 ${conversation.lastMessage}`
    }
    if (conversation.lastMessageType === 'vibe_recap') {
      return '🎧 Vibe Recap'
    }
    return conversation.lastMessage
  }

  return (
    <div
      onClick={() => navigate(`/chat/${conversation.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        cursor: 'pointer',
        background: isActive ? 'var(--brand-subtle)' : 'transparent',
        borderRadius: 12,
        margin: '0 8px',
        transition: 'background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isActive)
          e.currentTarget.style.background = 'var(--bg-tertiary)'
      }}
      onMouseLeave={e => {
        if (!isActive)
          e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Avatar with online dot */}
      <Avatar
        name={conversation.user.name}
        src={conversation.user.avatarUrl}
        size={48}
        showOnline={conversation.isOnline}
      />

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 3,
        }}>
          <span style={{
            fontSize: 15,
            fontWeight: conversation.unreadCount > 0 ? 700 : 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {conversation.user.name}
          </span>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            flexShrink: 0,
            marginLeft: 8,
          }}>
            {conversation.lastMessageAt}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 13,
            color: conversation.unreadCount > 0
              ? 'var(--text-secondary)'
              : 'var(--text-muted)',
            fontWeight: conversation.unreadCount > 0 ? 500 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}>
            {getLastMessagePreview()}
          </span>

          {/* Unread badge */}
          {conversation.unreadCount > 0 && (
            <div style={{
              minWidth: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              flexShrink: 0,
              marginLeft: 8,
            }} />
          )}
        </div>
      </div>
    </div>
  )
}