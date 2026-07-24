'use client'

import { useSyncExternalStore, useCallback } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

const CONSENT_KEY = 'cookie-consent-accepted'
const CONSENT_EVENT = 'cookie-consent-change'

// ── Consent as an external store ───────────────────────────────
// Reading localStorage during render (or via a lazy useState initializer)
// is unsafe: it is unavailable during SSR and would diverge between the
// server render and the first client render, causing a hydration mismatch.
// `useSyncExternalStore` is the purpose-built primitive for client-only
// external state: it renders the server snapshot during hydration and
// reconciles to the client snapshot afterwards, so SSR and first paint
// stay identical while still reflecting real consent state on the client.

function subscribe(callback: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1'
  } catch {
    // localStorage unavailable — treat as accepted so the banner stays hidden
    return true
  }
}

function getServerSnapshot(): boolean {
  // No localStorage on the server: render as "accepted" (banner hidden) so
  // the server output matches the first client render.
  return true
}

export default function CookieBanner() {
  const t = useTranslations('cookieBanner')
  const accepted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const accept = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_KEY, '1')
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(CONSENT_EVENT))
  }, [])

  if (accepted) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        right: '1.5rem',
        maxWidth: '480px',
        background: '#111111',
        borderLeft: '3px solid #F97316',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeftWidth: '3px',
        borderLeftColor: '#F97316',
        padding: '1rem 1.25rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
      }}
    >
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '13px',
            color: '#CCCCCC',
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          {t('text')}{' '}
          <Link
            href="/privacy"
            style={{ color: '#F97316', textDecoration: 'none' }}
          >
            {t('privacyLink')}
          </Link>
          .
        </p>
      </div>
      <button
        onClick={accept}
        style={{
          flexShrink: 0,
          background: '#F97316',
          color: '#000000',
          border: 'none',
          padding: '0.65rem 1.1rem',
          minWidth: '44px',
          minHeight: '44px',
          fontFamily: 'var(--font-roboto-mono)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {t('accept')}
      </button>
    </div>
  )
}
