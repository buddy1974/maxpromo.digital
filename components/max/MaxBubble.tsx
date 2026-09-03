'use client'

interface MaxBubbleProps {
  onClick: () => void
}

/** Fixed bottom-right launch bubble. 56px, orange, soft glow. */
export function MaxBubble({ onClick }: MaxBubbleProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open Max"
      style={{
        position:     'fixed',
        bottom:       '24px',
        right:        '24px',
        zIndex:       1000,
        width:        '56px',
        height:       '56px',
        borderRadius: '50%',
        background:   'var(--brand-primary)',
        border:       'none',
        cursor:       'pointer',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        boxShadow:    '0 4px 24px color-mix(in srgb, var(--brand-primary) 45%, transparent), 0 2px 8px rgba(0,0,0,0.4)',
        transition:   'transform 150ms ease, box-shadow 150ms ease',
        flexShrink:   0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform  = 'scale(1.06)'
        e.currentTarget.style.boxShadow  = '0 6px 32px color-mix(in srgb, var(--brand-primary) 55%, transparent), 0 2px 8px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform  = 'scale(1)'
        e.currentTarget.style.boxShadow  = '0 4px 24px color-mix(in srgb, var(--brand-primary) 45%, transparent), 0 2px 8px rgba(0,0,0,0.4)'
      }}
    >
      {/* Chat bubble icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="#080808"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
