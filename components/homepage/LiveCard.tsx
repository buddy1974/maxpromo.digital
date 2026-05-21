'use client'

interface SlideCard {
  label: string
  items: string[]
  meta: string[]
}

interface LiveCardProps {
  slide: SlideCard
  parallaxX?: number
  parallaxY?: number
}

const DOT_CLASSES = ['pulse-dot-1', 'pulse-dot-2', 'pulse-dot-3'] as const

export function LiveCard({ slide, parallaxX = 0, parallaxY = 0 }: LiveCardProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100px',
        right: '2rem',
        zIndex: 20,
        width: '240px',
        transform: `translate(${parallaxX}px, ${parallaxY}px)`,
        transition: 'transform 120ms linear',
        willChange: 'transform',
        // Hide on mobile — compact variant handles that
        display: 'none',
      }}
      className="md:block"
    >
      <div
        style={{
          background: 'rgba(10,10,14,0.70)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(249,115,22,0.15)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.04)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 14px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#F97316',
              textTransform: 'uppercase',
            }}
          >
            {slide.label}
          </span>
          <span
            className="pulse-dot-1"
            style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F97316', display: 'inline-block' }}
          />
        </div>

        {/* Items */}
        <div style={{ padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {slide.items.map((item, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                <span
                  className={DOT_CLASSES[i % 3]}
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#F97316',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.75)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'rgba(249,115,22,0.7)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {slide.meta[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
