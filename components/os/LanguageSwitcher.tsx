'use client'

/**
 * components/os/LanguageSwitcher.tsx
 *
 * Persistent DE/EN toggle for the OS interface language (not a document's
 * language — see lib/os-i18n/context.tsx for the distinction). Lives in
 * the sidebar footer, next to Sign Out, so it's reachable from every
 * authenticated /os page.
 */

import { useOsLocale } from '@/lib/os-i18n/context'

const mono = 'var(--font-roboto-mono)'

export function LanguageSwitcher() {
  const { locale, setLocale } = useOsLocale()

  return (
    <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }} role="group" aria-label="OS language">
      {(['de', 'en'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          style={{
            flex: 1,
            background: locale === l ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'transparent',
            border: `1px solid ${locale === l ? 'var(--brand-primary-dark)' : 'var(--brand-border)'}`,
            color: locale === l ? 'var(--brand-text)' : 'var(--brand-text-muted)',
            fontFamily: mono, fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
            padding: '6px 8px', cursor: 'pointer', borderRadius: '2px', textTransform: 'uppercase',
          }}
        >
          {l === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
        </button>
      ))}
    </div>
  )
}
