'use client'

interface HeroSlideNavProps {
  total: number
  active: number
  onSelect: (index: number) => void
}

export function HeroSlideNav({ total, active, onSelect }: HeroSlideNavProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '48px',
        right: '2rem',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '6px',
        padding: '6px 8px',
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Slide ${i + 1}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '3px',
          }}
        >
          {/* Number */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: i === active ? 700 : 400,
              letterSpacing: '0.05em',
              color: i === active ? '#F97316' : 'rgba(255,255,255,0.3)',
              transition: 'color 300ms ease',
              lineHeight: 1,
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>

          {/* Progress bar — only on active */}
          <div
            style={{
              width: '20px',
              height: '1px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '1px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {i === active && (
              <div
                key={`bar-${i}`}
                className="hero-progress-bar"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  background: '#F97316',
                  borderRadius: '1px',
                }}
              />
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
