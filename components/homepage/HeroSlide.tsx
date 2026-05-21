'use client'

import Image from 'next/image'
import { useState } from 'react'

interface HeroSlideProps {
  src: string      // /images/homepage/hero-{n}.png
  alt: string
  /** 1-based index drives the ken-burns variant */
  slideIndex: number
  /** Whether this slide is currently visible */
  active: boolean
  /** Mouse parallax offset in px — applied to the image layer */
  parallaxX?: number
  parallaxY?: number
}

const KB_CLASSES = [
  'hero-ken-burns-1',
  'hero-ken-burns-2',
  'hero-ken-burns-3',
  'hero-ken-burns-4',
] as const

export function HeroSlide({
  src,
  alt,
  slideIndex,
  active,
  parallaxX = 0,
  parallaxY = 0,
}: HeroSlideProps) {
  const [imgError, setImgError] = useState(false)
  // Force Ken Burns restart when slide becomes active
  const kbKey = active ? `kb-${slideIndex}-active` : `kb-${slideIndex}-idle`

  return (
    <div
      aria-hidden={!active}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: active ? 1 : 0,
        transition: 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
        willChange: 'opacity',
      }}
    >
      {/* Background image with Ken Burns */}
      {!imgError && (
        <div
          key={kbKey}
          className={active ? KB_CLASSES[(slideIndex - 1) % 4] : undefined}
          style={{
            position: 'absolute',
            inset: '-4%',    // oversized so Ken Burns never reveals edge
            transform: `translate(${parallaxX}px, ${parallaxY}px)`,
            transition: 'transform 120ms linear',
            willChange: 'transform',
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={slideIndex === 1}
            loading={slideIndex === 1 ? 'eager' : 'lazy'}
            style={{ objectFit: 'cover', objectPosition: 'center right' }}
            onError={() => setImgError(true)}
            sizes="100vw"
          />
        </div>
      )}

      {/* z-1: Dark gradient — dark left (text), fades to right */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(to right, hsl(240 14% 4%) 36%, hsl(240 14% 4% / 0.80) 58%, hsl(240 14% 4% / 0.42) 100%)',
        }}
      />

      {/* z-1 bottom: extra fade for ticker readability */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          zIndex: 1,
          background: 'linear-gradient(to top, hsl(240 14% 4%) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
