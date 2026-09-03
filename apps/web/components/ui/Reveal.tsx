'use client'

/**
 * components/ui/Reveal.tsx
 *
 * Scroll-triggered fade-up reveal using IntersectionObserver.
 * Fires once when the element enters the viewport, then disconnects.
 *
 * Styles are applied via JS after mount so:
 *  , SSR renders visible content (no flash of invisible text)
 *  , Graceful degradation with JS disabled
 *  , No CLS (transform doesn't affect layout)
 *
 * Respects prefers-reduced-motion.
 */

import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'

export interface RevealProps {
  children: ReactNode
  /** Additional className forwarded to the wrapper div */
  className?: string
  /** Additional inline styles forwarded to the wrapper div */
  style?: CSSProperties
  /** Animation delay in ms, use for stagger effects */
  delay?: number
  /** Direction of the reveal movement */
  direction?: 'up' | 'left'
  /** IntersectionObserver threshold (0–1). Default 0.08 */
  threshold?: number
}

export function Reveal({
  children,
  className,
  style,
  delay = 0,
  direction = 'up',
  threshold = 0.08,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced-motion preference, skip animation entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const initialTransform =
      direction === 'up' ? 'translateY(24px)' : 'translateX(-16px)'

    el.style.opacity = '0'
    el.style.transform = initialTransform
    el.style.transition = [
      `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      `transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    ].join(', ')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'none'
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, direction, threshold])

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
