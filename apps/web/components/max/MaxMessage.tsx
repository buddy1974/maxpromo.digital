import type { ChatMessage } from '@/lib/chat/types'

interface MaxMessageProps {
  message: ChatMessage
}

/** Single message bubble. User = right/orange-text, Assistant = left/surface. */
export function MaxMessage({ message }: MaxMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display:       'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        padding:       '0 16px',
      }}
    >
      <div
        style={{
          maxWidth:     '82%',
          padding:      '10px 14px',
          borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
          background:   isUser ? 'var(--brand-primary-dark)' : 'var(--brand-surface-sunken)',
          border:       isUser ? 'none' : '1px solid var(--brand-surface-sunken)',
          fontFamily:   'var(--brand-font-body)',
          fontSize:     '14px',
          lineHeight:   1.6,
          color:        isUser ? 'var(--brand-on-primary)' : 'var(--brand-text)',
          whiteSpace:   'pre-wrap',
          wordBreak:    'break-word',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
