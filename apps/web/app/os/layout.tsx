import type { Metadata, Viewport } from 'next'
import { token } from '@maxpromo/design-tokens'

/**
 * The OS as an installable app (PWA, manifest at /os/manifest.webmanifest): standalone, its own
 * name and start page, never indexed. `viewport-fit=cover` lets the phone shell use the safe-area
 * insets (notch, home indicator); `interactive-widget=resizes-content` lets Android shrink the
 * layout when the keyboard opens (iOS is handled by --os-vvh in the shell).
 */
export const metadata: Metadata = {
  manifest: '/os/manifest.webmanifest',
  applicationName: 'Maxpromo OS',
  appleWebApp: { capable: true, title: 'Maxpromo OS', statusBarStyle: 'default' },
  robots: { index: false, follow: false },
  icons: { apple: '/images/brand/maxpromo-apple-touch-icon.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: token.background,
}

export default function OsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--brand-background)',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
