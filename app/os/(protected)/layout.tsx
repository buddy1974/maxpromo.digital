'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface ScannedContact {
  name: string; company: string; email: string; phone: string
  address: string; city: string; postcode: string; country: string
  website: string; notes: string; confidence: 'high' | 'medium' | 'low'
}

const mono = 'var(--font-roboto-mono)'
const sans = 'var(--font-inter)'

const MAIN_NAV = [
  { icon: '🏠', label: 'Dashboard',    href: '/os' },
  { icon: '👥', label: 'Clients',      href: '/os/clients' },
  { icon: '📄', label: 'Invoices',     href: '/os/invoices' },
  { icon: '📋', label: 'Angebote',     href: '/os/angebote' },
  { icon: '🎯', label: 'Jobs / Kanban', href: '/os/jobs' },
  { icon: '📧', label: 'Leads',        href: '/os/leads' },
  { icon: '📰', label: 'Newsletter',   href: '/os/newsletter' },
  { icon: '📥', label: 'Inbox',        href: '/os/inbox' },
]

const EXT_LINKS = [
  { icon: '🌐', label: 'maxpromo.digital', href: 'https://maxpromo.digital', external: true },
  { icon: '🔍', label: 'Automation Audit', href: '/automation-audit',         external: false },
  { icon: '💰', label: 'Estimate Tool',    href: '/estimate',                 external: false },
]

const QUICK_PROMPTS = [
  'Draft an invoice description',
  'Write a follow-up email',
  'Suggest a price for this project',
  'Summarise this lead',
]

interface AIMsg { role: 'user' | 'assistant'; content: string }

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [auth, setAuth]           = useState<boolean | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [aiOpen, setAiOpen]       = useState(false)
  const [msgs, setMsgs]           = useState<AIMsg[]>([])
  const [input, setInput]         = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // Quick Scan state
  const [qsOpen,      setQsOpen]      = useState(false)
  const [qsTab,       setQsTab]       = useState<'scan' | 'paste'>('scan')
  const [qsPaste,     setQsPaste]     = useState('')
  const [qsPreview,   setQsPreview]   = useState('')
  const [qsBase64,    setQsBase64]    = useState('')
  const [qsMime,      setQsMime]      = useState('image/jpeg')
  const [qsLoading,   setQsLoading]   = useState(false)
  const [qsExtracted, setQsExtracted] = useState<ScannedContact | null>(null)
  const [qsError,     setQsError]     = useState('')
  const [qsSaving,    setQsSaving]    = useState(false)
  const [qsSaved,     setQsSaved]     = useState(false)
  const qsFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const ok = sessionStorage.getItem('os-auth') === 'true'
    if (!ok) router.replace('/os/login')
    else setAuth(true)
  }, [router])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  function logout() {
    sessionStorage.removeItem('os-auth')
    router.replace('/os/login')
  }

  async function sendMsg(content: string) {
    if (!content.trim()) return
    const next: AIMsg[] = [...msgs, { role: 'user', content }]
    setMsgs(next)
    setInput('')
    setAiLoading(true)
    try {
      const res  = await fetch('/api/os/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json() as { content: string }
      setMsgs(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Error — please try again.' }])
    } finally {
      setAiLoading(false)
    }
  }

  function qsHandleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      setQsPreview(dataUrl)
      setQsBase64(b64)
      setQsMime(header.match(/:(.*?);/)?.[1] ?? 'image/jpeg')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function qsExtract() {
    setQsLoading(true); setQsError(''); setQsExtracted(null)
    try {
      const body = qsTab === 'scan' && qsBase64
        ? { image: qsBase64, mediaType: qsMime }
        : { text: qsPaste }
      const res = await fetch('/api/os/ai/scan-client', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setQsExtracted(await res.json() as ScannedContact)
    } catch { setQsError('Extraction failed. Please try again.') }
    finally { setQsLoading(false) }
  }

  async function qsSaveClient() {
    if (!qsExtracted?.name) return
    setQsSaving(true)
    try {
      await fetch('/api/os/clients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    qsExtracted.name,
          company: qsExtracted.company || undefined,
          email:   qsExtracted.email   || undefined,
          phone:   qsExtracted.phone   || undefined,
          address: qsExtracted.address || undefined,
          city:    [qsExtracted.city, qsExtracted.postcode].filter(Boolean).join(' ') || undefined,
          country: qsExtracted.country || 'Germany',
          notes:   qsExtracted.notes   || undefined,
        }),
      })
      setQsSaved(true)
      setTimeout(() => {
        setQsOpen(false); setQsExtracted(null); setQsSaved(false)
        setQsPreview(''); setQsBase64(''); setQsPaste('')
      }, 1500)
    } finally { setQsSaving(false) }
  }

  function qsReset() {
    setQsExtracted(null); setQsError(''); setQsPreview(''); setQsBase64(''); setQsPaste('')
  }

  if (!auth) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0A0A' }}>
        <span style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.3em' }}>LOADING...</span>
      </div>
    )
  }

  const isActive = (href: string) =>
    href === '/os' ? pathname === '/os' : pathname.startsWith(href)

  return (
    <div>

      {/* ── SIDEBAR ── */}
      <nav className={`os-sidebar${mobileOpen ? ' open' : ''}`}>

        {/* Header */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <p style={{ fontFamily: mono, fontSize: '13px', fontWeight: 700, color: '#F97316', margin: 0, letterSpacing: '0.1em' }}>
            MAXPROMO OS
          </p>
          <p style={{ fontFamily: sans, fontSize: '11px', color: '#555555', margin: '5px 0 0' }}>
            Business Operating System
          </p>
        </div>

        {/* Scrollable nav area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>

          <span className="os-section-label">MAIN</span>
          {MAIN_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`os-nav-item${isActive(item.href) ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="os-nav-icon">{item.icon}</span>
              <span className="os-nav-label">{item.label}</span>
            </Link>
          ))}

          <span className="os-section-label" style={{ paddingTop: '12px' }}>TOOLS</span>
          <button
            onClick={() => { setAiOpen(true); setMobileOpen(false) }}
            className="os-nav-item"
          >
            <span className="os-nav-icon">🤖</span>
            <span className="os-nav-label">AI Assistant</span>
          </button>

          <div style={{ margin: '12px 16px', height: '1px', background: 'rgba(255,255,255,0.06)' }} />

          <span className="os-section-label" style={{ paddingTop: '4px' }}>LINKS</span>
          {EXT_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="os-nav-item"
              onClick={() => setMobileOpen(false)}
            >
              <span className="os-nav-icon">{link.icon}</span>
              <span className="os-nav-label">{link.label}</span>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <p style={{ fontFamily: sans, fontSize: '13px', color: '#cccccc', margin: '0 0 3px' }}>Marcel Tabit Akwe</p>
          <p style={{ fontFamily: sans, fontSize: '11px', color: '#555555', margin: 0 }}>info@maxpromo.digital</p>
          <button onClick={logout} className="os-logout-btn">← Sign Out</button>
        </div>
      </nav>

      {/* ── MOBILE BACKDROP ── */}
      <div
        className={`os-backdrop${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── HAMBURGER BUTTON ── */}
      <button
        className="os-hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span className="os-hamburger-line" />
        <span className="os-hamburger-line" />
        <span className="os-hamburger-line" />
      </button>

      {/* ── MAIN CONTENT ── */}
      <main className="os-main">
        {children}
      </main>

      {/* ── FLOATING BUTTONS ── */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 100, alignItems: 'flex-end' }}>
        {!aiOpen && (
          <button
            onClick={() => { setQsOpen(true); qsReset() }}
            style={{
              background: '#111111', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316',
              fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em',
              padding: '10px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              textTransform: 'uppercase', borderRadius: '2px',
            }}
          >
            📷 Quick Scan
          </button>
        )}
        {!aiOpen && (
          <button
            onClick={() => setAiOpen(true)}
            style={{
              background: '#F97316', color: '#000000',
              fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em',
              border: 'none', padding: '12px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              textTransform: 'uppercase', borderRadius: '2px',
            }}
          >
            ◈ Ask AI
          </button>
        )}
      </div>

      {/* ── AI SLIDE-OVER PANEL ── */}
      {aiOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, width: '380px', height: '100vh',
          background: '#0D0D0D', borderLeft: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', zIndex: 200,
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: sans, fontWeight: 700, fontSize: '14px', color: '#FFFFFF', margin: 0 }}>AI Assistant</p>
              <p style={{ fontFamily: mono, fontSize: '9px', color: '#444444', letterSpacing: '0.18em', margin: '3px 0 0' }}>CLAUDE SONNET 4.6</p>
            </div>
            <button onClick={() => setAiOpen(false)} style={{ background: 'none', border: 'none', color: '#555555', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>

          {msgs.length === 0 && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontFamily: mono, fontSize: '9px', color: '#444444', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 10px' }}>Quick prompts</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => sendMsg(p)} style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)', color: '#777777', fontFamily: sans, fontSize: '12px', padding: '9px 12px', textAlign: 'left', cursor: 'pointer', borderRadius: '2px' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {msgs.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: msg.role === 'user' ? 'rgba(249,115,22,0.1)' : '#111111',
                border: `1px solid ${msg.role === 'user' ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)'}`,
                padding: '10px 14px', borderRadius: '2px',
              }}>
                <p style={{ fontFamily: sans, fontSize: '13px', color: '#CCCCCC', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              </div>
            ))}
            {aiLoading && (
              <div style={{ alignSelf: 'flex-start', background: '#111111', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '2px' }}>
                <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', margin: 0, letterSpacing: '0.2em' }}>thinking...</p>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input) } }}
              placeholder="Ask anything..."
              style={{ flex: 1, background: '#111111', border: '1px solid rgba(255,255,255,0.08)', color: '#FFFFFF', fontFamily: sans, fontSize: '13px', padding: '10px 12px', outline: 'none', borderRadius: '2px' }}
            />
            <button
              onClick={() => sendMsg(input)}
              disabled={aiLoading || !input.trim()}
              style={{ background: '#F97316', border: 'none', color: '#000000', fontFamily: mono, fontWeight: 700, fontSize: '14px', padding: '10px 16px', cursor: 'pointer', opacity: (aiLoading || !input.trim()) ? 0.4 : 1 }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* ── QUICK SCAN MODAL ── */}
      {qsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#111111', border: '1px solid rgba(249,115,22,0.3)', width: '100%', maxWidth: '480px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: sans, fontWeight: 700, fontSize: '15px', color: '#FFFFFF', margin: 0 }}>Quick Scan</p>
              <button onClick={() => setQsOpen(false)} style={{ background: 'none', border: 'none', color: '#555555', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(['scan', 'paste'] as const).map(t => (
                <button key={t} onClick={() => { setQsTab(t); qsReset() }} style={{ flex: 1, padding: '10px', background: qsTab === t ? 'rgba(249,115,22,0.08)' : 'none', border: 'none', borderBottom: qsTab === t ? '2px solid #F97316' : '2px solid transparent', color: qsTab === t ? '#F97316' : '#555555', fontFamily: mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  {t === 'scan' ? '📷 Scan' : '📝 Paste'}
                </button>
              ))}
            </div>

            <div style={{ padding: '20px' }}>
              {!qsExtracted && (
                <>
                  {qsTab === 'scan' && (
                    <div>
                      {!qsPreview ? (
                        <button
                          onClick={() => qsFileRef.current?.click()}
                          style={{ width: '100%', background: '#0A0A0A', border: '2px dashed rgba(249,115,22,0.3)', color: '#F97316', fontFamily: mono, fontSize: '11px', letterSpacing: '0.1em', padding: '32px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px', textAlign: 'center' }}
                        >
                          📷 Take Photo or Select Image
                          <br /><span style={{ fontSize: '9px', color: '#555555', fontWeight: 400 }}>JPG · PNG · HEIC · WEBP · PDF</span>
                        </button>
                      ) : (
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                          <img src={qsPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px' }} />
                        </div>
                      )}
                    </div>
                  )}

                  {qsTab === 'paste' && (
                    <textarea
                      value={qsPaste}
                      onChange={e => setQsPaste(e.target.value)}
                      rows={5}
                      placeholder={'Paste email signature, WhatsApp contact, or typed details:\n\nJohn Smith\nAcme GmbH\njohn@acme.de\n+49 211 123456'}
                      style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', color: '#FFFFFF', fontFamily: sans, fontSize: '13px', padding: '10px 12px', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: '12px' }}
                    />
                  )}

                  {qsError && <p style={{ fontFamily: mono, fontSize: '10px', color: '#ef4444', margin: '0 0 10px', letterSpacing: '0.06em' }}>⚠ {qsError}</p>}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={qsExtract}
                      disabled={qsLoading || (qsTab === 'scan' ? !qsBase64 : !qsPaste.trim())}
                      style={{ background: '#F97316', border: 'none', color: '#000000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px', opacity: qsLoading || (qsTab === 'scan' ? !qsBase64 : !qsPaste.trim()) ? 0.5 : 1 }}
                    >
                      {qsLoading ? '⟳ Reading...' : '◈ Extract Contact'}
                    </button>
                    {qsTab === 'scan' && qsPreview && (
                      <button onClick={() => { setQsPreview(''); setQsBase64('') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#555555', fontFamily: mono, fontSize: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '2px' }}>
                        Remove
                      </button>
                    )}
                  </div>
                </>
              )}

              {qsExtracted && !qsSaved && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <p style={{ fontFamily: mono, fontSize: '9px', color: '#888888', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>Extracted contact</p>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: qsExtracted.confidence === 'high' ? '#22c55e' : qsExtracted.confidence === 'medium' ? '#F97316' : '#ef4444', background: qsExtracted.confidence === 'high' ? '#22c55e22' : qsExtracted.confidence === 'medium' ? '#F9731622' : '#ef444422', padding: '2px 8px', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '2px' }}>
                      {qsExtracted.confidence} confidence
                    </span>
                  </div>
                  <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      ['Name',    qsExtracted.name],
                      ['Company', qsExtracted.company],
                      ['Email',   qsExtracted.email],
                      ['Phone',   qsExtracted.phone],
                      ['Address', qsExtracted.address],
                      ['City',    [qsExtracted.city, qsExtracted.postcode].filter(Boolean).join(' ')],
                      ['Country', qsExtracted.country],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <p key={k} style={{ fontFamily: sans, fontSize: '12px', color: '#CCCCCC', margin: 0 }}>
                        <span style={{ fontFamily: mono, fontSize: '9px', color: '#555555', letterSpacing: '0.1em', display: 'inline-block', width: '60px' }}>{k}</span>
                        {v}
                      </p>
                    ))}
                  </div>
                  {qsExtracted.confidence === 'low' && (
                    <p style={{ fontFamily: mono, fontSize: '9px', color: '#ef4444', margin: '0 0 12px', letterSpacing: '0.06em' }}>⚠ Low confidence — verify before saving</p>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={qsSaveClient} disabled={qsSaving} style={{ background: '#F97316', border: 'none', color: '#000000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px', opacity: qsSaving ? 0.6 : 1 }}>
                      {qsSaving ? 'Saving...' : '+ Save as New Client'}
                    </button>
                    <button onClick={qsReset} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#555555', fontFamily: mono, fontSize: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '2px' }}>
                      ↺ Re-scan
                    </button>
                  </div>
                </div>
              )}

              {qsSaved && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontFamily: mono, fontSize: '14px', color: '#22c55e', margin: '0 0 6px' }}>✓ Client saved</p>
                  <p style={{ fontFamily: mono, fontSize: '10px', color: '#555555', margin: 0 }}>{qsExtracted?.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick scan file input */}
      <input
        ref={qsFileRef}
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        style={{ display: 'none' }}
        onChange={qsHandleFile}
      />
    </div>
  )
}
