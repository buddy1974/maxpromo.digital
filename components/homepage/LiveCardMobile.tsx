'use client'

interface SlideCard {
  label: string
  items: string[]
  meta: string[]
}

interface LiveCardMobileProps {
  slides: SlideCard[]
  activeSlide: number
  onSlideSelect: (i: number) => void
}

const DOT_CLASSES = ['pulse-dot-1', 'pulse-dot-2', 'pulse-dot-3'] as const

export function LiveCardMobile({ slides, activeSlide, onSlideSelect }: LiveCardMobileProps) {
  const slide = slides[activeSlide] ?? slides[0]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        width: 'calc(100% - 4rem)',
        maxWidth: '320px',
      }}
      className="md:hidden"
    >
      <div
        style={{
          background: 'rgba(10,10,14,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(249,115,22,0.12)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        }}
      >
        {/* Header, label + slide dots */}
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#F97316',
              textTransform: 'uppercase',
            }}
          >
            {slide.label}
          </span>

          {/* Dots, oversized padding for 44px touch target */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => onSlideSelect(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  padding: '10px 5px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: i === activeSlide ? '14px' : '5px',
                    height: '5px',
                    borderRadius: '3px',
                    background: i === activeSlide ? '#F97316' : 'rgba(255,255,255,0.22)',
                    transition: 'width 250ms ease, background 250ms ease',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content, readable 11px minimum */}
        <div style={{ padding: '10px 12px 12px', display: 'flex', gap: '12px' }}>
          {slide.items.slice(0, 2).map((item, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                <span
                  className={DOT_CLASSES[i % 3]}
                  style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F97316', display: 'inline-block', flexShrink: 0 }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.65)',
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
                  fontSize: '11px',
                  color: 'rgba(249,115,22,0.70)',
                  paddingLeft: '10px',
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
