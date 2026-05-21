'use client'

interface OperationalTickerProps {
  items: string[]
}

export function OperationalTicker({ items }: OperationalTickerProps) {
  const doubled = [...items, ...items]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.50)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 -1px 20px rgba(249,115,22,0.04)',
      }}
    >
      {/* Fixed LIVE label */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 16px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          height: '100%',
          background: 'rgba(249,115,22,0.05)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          className="pulse-dot-1"
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#F97316',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 700,
            color: '#F97316',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          LIVE
        </span>
      </div>

      {/* Scrolling track */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          className="hero-ticker-track"
          style={{
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            width: 'max-content',
          }}
        >
          {doubled.map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.32)',
                letterSpacing: '0.06em',
                padding: '0 28px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {item}
              <span style={{ color: 'rgba(249,115,22,0.3)', fontSize: '8px' }}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
