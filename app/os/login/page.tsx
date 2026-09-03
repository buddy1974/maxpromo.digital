'use client'
import { Suspense, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OsLocaleProvider, useOsLocale } from '@/lib/os-i18n/context'
import { LanguageSwitcher } from '@/components/os/LanguageSwitcher'

const mono = 'var(--font-roboto-mono)'
const sans = 'var(--font-inter)'

/**
 * Inner form component — uses useSearchParams() to read the ?returnTo
 * param. Next.js 15+ requires any client component using useSearchParams
 * to be wrapped in a <Suspense> boundary at its import site, otherwise
 * static generation bails out with "missing-suspense-with-csr-bailout".
 *
 * The export below provides that Suspense wrapper so the page itself can
 * still pre-render at build time.
 *
 * Login sits OUTSIDE app/os/(protected), so it does not inherit that
 * layout's OsLocaleProvider — it mounts its own. Both read the same
 * `os_locale` cookie (path=/os), so the language chosen on the login
 * screen is the language the OS opens in.
 */
function LoginForm() {
  const { t } = useOsLocale()
  const router = useRouter()
  const search = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/os/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        // The API's error string is not localised; a rejected password has
        // exactly one meaning here, so render the dictionary's message
        // rather than leaking an English server string into a German UI.
        setError(t.login.incorrectCode)
        setLoading(false)
        return
      }
      const returnTo = search.get('returnTo')
      router.replace(returnTo && returnTo.startsWith('/os') ? returnTo : '/os')
    } catch {
      setError(t.login.networkError)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '320px' }}>
      <label style={{ fontFamily: mono, fontSize: '10px', color: '#555555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
        {t.login.accessCode}
      </label>

      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoFocus
        autoComplete="current-password"
        style={{
          background: '#0D0D0D',
          border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: '4px',
          color: '#FFFFFF',
          fontFamily: mono,
          fontSize: '14px',
          padding: '10px 14px',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s ease',
        }}
      />

      {error && (
        <p style={{ fontFamily: sans, fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        style={{
          marginTop: '12px',
          background: 'var(--brand-primary)',
          border: 'none',
          borderRadius: '4px',
          color: '#000000',
          fontFamily: sans,
          fontWeight: 700,
          fontSize: '13px',
          padding: '10px 20px',
          cursor: loading || !password ? 'not-allowed' : 'pointer',
          opacity: loading || !password ? 0.6 : 1,
          width: '100%',
          transition: 'opacity 0.15s ease',
        }}
      >
        {loading ? t.login.entering : t.login.enter}
      </button>

      <div style={{ marginTop: '4px' }}>
        <LanguageSwitcher />
      </div>
    </form>
  )
}

function LoginShell({ children }: { children: React.ReactNode }) {
  const { t } = useOsLocale()
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0A0A0A',
      flexDirection: 'column',
    }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <p style={{ fontFamily: mono, fontSize: '24px', fontWeight: 700, color: 'var(--brand-primary)', letterSpacing: '0.1em', margin: 0 }}>
          {t.login.brand}
        </p>
        <p style={{ fontFamily: sans, fontSize: '13px', color: '#555555', margin: '8px 0 0' }}>
          {t.login.tagline}
        </p>
      </div>
      {children}
    </div>
  )
}

export default function OsLoginPage() {
  return (
    <OsLocaleProvider>
      <LoginShell>
        <Suspense
          fallback={
            <div style={{ width: '320px', height: '160px' }} aria-hidden="true" />
          }
        >
          <LoginForm />
        </Suspense>
      </LoginShell>
    </OsLocaleProvider>
  )
}
