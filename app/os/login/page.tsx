'use client'
import { Suspense, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
 */
function LoginForm() {
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
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Incorrect access code')
        setLoading(false)
        return
      }
      const returnTo = search.get('returnTo')
      router.replace(returnTo && returnTo.startsWith('/os') ? returnTo : '/os')
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '320px' }}>
      <label style={{ fontFamily: mono, fontSize: '10px', color: '#555555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
        Access Code
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
          background: '#F97316',
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
        {loading ? 'Entering...' : 'Enter OS →'}
      </button>
    </form>
  )
}

function LoginShell({ children }: { children: React.ReactNode }) {
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
        <p style={{ fontFamily: mono, fontSize: '24px', fontWeight: 700, color: '#F97316', letterSpacing: '0.1em', margin: 0 }}>
          MAXPROMO OS
        </p>
        <p style={{ fontFamily: sans, fontSize: '13px', color: '#555555', margin: '8px 0 0' }}>
          Business Operating System
        </p>
      </div>
      {children}
    </div>
  )
}

export default function OsLoginPage() {
  return (
    <LoginShell>
      <Suspense
        fallback={
          <div style={{ width: '320px', height: '160px' }} aria-hidden="true" />
        }
      >
        <LoginForm />
      </Suspense>
    </LoginShell>
  )
}
