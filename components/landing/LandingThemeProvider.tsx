'use client'

/**
 * LandingThemeProvider
 *
 * Injects --brand-accent and --brand-bg CSS custom properties onto a wrapper div.
 * All child section components reference these tokens instead of hardcoding colors.
 *
 * VG-01 — Dark background rule:
 *   backgroundDark: true  → --brand-bg: #080808  (all products by default)
 *   backgroundDark: false → --brand-bg: #F5F4F0  (clinical/wellness exception)
 *                           Currently only PraxisOS. Do not add exceptions here —
 *                           add backgroundDark: false to the registry entry instead.
 *
 * VG-02 — brandColor is reserved for headline accent, bullet icons, dividers.
 *          Never use var(--brand-accent) for CTA buttons — those are always #F97316 (VG-03).
 */

interface LandingThemeProviderProps {
  brandColor:    string
  backgroundDark: boolean
  children:      React.ReactNode
}

export function LandingThemeProvider({
  brandColor,
  backgroundDark,
  children,
}: LandingThemeProviderProps) {
  const bg      = backgroundDark ? '#080808' : '#F5F4F0'
  const fg      = backgroundDark ? '#F0EDE6' : '#111111'
  const fgMuted = backgroundDark ? 'rgba(240,237,230,0.6)' : 'rgba(17,17,17,0.6)'

  return (
    <div
      style={{
        '--brand-accent': brandColor,
        '--brand-bg':     bg,
        '--brand-fg':     fg,
        '--brand-muted':  fgMuted,
        background:       bg,
        color:            fg,
        minHeight:        '100vh',
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
