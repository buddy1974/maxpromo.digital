'use client'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const OS_PASSWORD = 'maxpromo-os-2026'
const mono = 'var(--font-space-mono)'
const grotesk = 'var(--font-space-grotesk)'

export default function OsLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password === OS_PASSWORD) {
      sessionStorage.setItem('os-auth', 'true')
      router.replace('/os')
    } else {
      setError('Invalid password.')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0A0A0A',
        flexDirection: 'column',
      }}
    >
      {/* Wordmark */}
      <div style={{ marginBottom: '8px', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: grotesk,
            fontSize: '28px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          MaxPromo <span style={{ color: '#F97316' }}>Digital</span>
        </p>
        <p
          style={{
            fontFamily: mono,
            fontSize: '11px',
            color: '#555555',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            margin: '8px 0 0',
          }}
        >
          MaxPromo OS
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: '48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '320px',
        }}
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.1)',
            borderTop: '2px solid rgba(249,115,22,0.4)',
            color: '#FFFFFF',
            fontFamily: mono,
            fontSize: '14px',
            padding: '13px 16px',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <p
            style={{
              fontFamily: mono,
              fontSize: '11px',
              color: '#ef4444',
              margin: 0,
              letterSpacing: '0.05em',
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            background: '#F97316',
            border: 'none',
            color: '#000000',
            fontFamily: mono,
            fontWeight: 700,
            fontSize: '12px',
            letterSpacing: '0.15em',
            padding: '14px 24px',
            cursor: loading || !password ? 'not-allowed' : 'pointer',
            opacity: loading || !password ? 0.6 : 1,
            textTransform: 'uppercase',
          }}
        >
          {loading ? 'ENTERING...' : 'ENTER OS'}
        </button>
      </form>
    </div>
  )
}
