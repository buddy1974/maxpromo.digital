'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

interface HeroSlideProps {
  src: string
  alt: string
  slideIndex: number   // 1-based — drives Ken Burns variant
  active: boolean
}

const KB_CLASSES = [
  'hero-ken-burns-1',
  'hero-ken-burns-2',
  'hero-ken-burns-3',
  'hero-ken-burns-4',
] as const

export function HeroSlide({ src, alt, slideIndex, active }: HeroSlideProps) {
  const [imgError, setImgError] = useState(false)
  const imgDivRef = useRef<HTMLDivElement>(null)

  // Restart Ken Burns animation when slide becomes active — no key remount, no flash.
  // Removing and re-adding the class with an interleaved reflow is the only
  // reliable way to reset a CSS animation without unmounting the element.
  useEffect(() => {
    const el = imgDivRef.current
    if (!el || !active) return
    const kbClass = KB_CLASSES[(slideIndex - 1) % 4]
    el.classList.remove(kbClass)
    void el.offsetWidth   // force reflow so the browser sees the class removal
    el.classList.add(kbClass)
  }, [active, slideIndex])

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
      {!imgError && (
        <div
          ref={imgDivRef}
          // Parallax is applied at the bgRef wrapper level in Hero.tsx —
          // no transform here. inset: -4% provides bleed for Ken Burns.
          style={{ position: 'absolute', inset: '-4%' }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={slideIndex === 1}
            loading={slideIndex === 1 ? 'eager' : 'lazy'}
            style={{ objectFit: 'cover', objectPosition: 'center right' }}
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1920px"
          />
        </div>
      )}

      {/* z-1: gradient — dark left, fades right */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(to right, hsl(240 14% 4%) 36%, hsl(240 14% 4% / 0.80) 58%, hsl(240 14% 4% / 0.42) 100%)',
        }}
      />

      {/* z-1 bottom: extra fade so ticker reads over image */}
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
