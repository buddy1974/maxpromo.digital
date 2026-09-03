'use client'

import Image from 'next/image'
import { useState } from 'react'

export interface ServiceImageProps {
  src: string
  alt: string
  /** Short description shown in the dark placeholder when the image is missing */
  placeholder: string
  aspectRatio?: string
  priority?: boolean
}

/**
 * Drop-in image block for service pages.
 * Shows Next/Image when the file exists; shows a dark placeholder when it doesn't.
 * Client-only because onError is required for the fallback.
 */
export function ServiceImage({
  src,
  alt,
  placeholder,
  aspectRatio = '16 / 9',
  priority = false,
}: ServiceImageProps) {
  const [failed, setFailed] = useState(false)

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio,
        overflow: 'hidden',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-bg-section)',
        border: '1px solid var(--color-border)',
      }}
    >
      {!failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          onError={() => setFailed(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 56rem"
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '28px',
              color: 'rgba(249,115,22,0.3)',
            }}
          >
            ◰
          </span>
          <p
            style={{
              fontFamily: 'var(--brand-font-sans)',
              fontSize: '10px',
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: 0,
              maxWidth: '24rem',
            }}
          >
            {placeholder}
          </p>
        </div>
      )}
    </div>
  )
}
