'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@maxpromo/ui'
import { OsLocaleProvider, useOsLocale } from '@/lib/os-i18n/context'
import { LanguageSwitcher } from '@/components/os/LanguageSwitcher'

interface ScannedContact {
  name: string; company: string; email: string; phone: string
  address: string; city: string; postcode: string; country: string
  website: string; notes: string; confidence: 'high' | 'medium' | 'low'
}

const mono = 'var(--font-roboto-mono)'
const sans = 'var(--font-inter)'

interface AIMsg { role: 'user' | 'assistant'; content: string }

/**
 * OsLocaleProvider must wrap the layout body so useOsLocale() is
 * available inside it — this thin outer component just establishes that
 * boundary; all real chrome lives in ProtectedLayoutInner below.
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <OsLocaleProvider>
      <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
    </OsLocaleProvider>
  )
}

function ProtectedLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useOsLocale()
  const router   = useRouter()
  const pathname = usePathname()

  const MAIN_NAV = [
    { icon: 'dashboard'  as const, label: t.sidebar.navDashboard,  href: '/os' },
    { icon: 'clients'    as const, label: t.sidebar.navClients,    href: '/os/clients' },
    { icon: 'invoice'    as const, label: t.sidebar.navInvoices,   href: '/os/invoices' },
    { icon: 'quote'      as const, label: t.sidebar.navAngebote,   href: '/os/angebote' },
    { icon: 'jobs'       as const, label: t.sidebar.navJobs,       href: '/os/jobs' },
    { icon: 'leads'      as const, label: t.sidebar.navLeads,      href: '/os/leads' },
    { icon: 'newsletter' as const, label: t.sidebar.navNewsletter, href: '/os/newsletter' },
    { icon: 'inbox'      as const, label: t.sidebar.navInbox,      href: '/os/inbox' },
  ]

  const EXT_LINKS = [
    { icon: 'external'   as const, label: t.sidebar.linkWebsite,          href: 'https://maxpromo.digital', external: true },
  ]

  const QUICK_PROMPTS = [t.ai.prompt1, t.ai.prompt2, t.ai.prompt3, t.ai.prompt4]
  // Auth is now enforced by middleware.ts (signed httpOnly cookie). No
  // client-side check needed — if we reach this layout, we're authed.
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
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function logout() {
    try {
      await fetch('/api/os/logout', { method: 'POST' })
    } finally {
      router.replace('/os/login')
    }
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
      setMsgs(prev => [...prev, { role: 'assistant', content: t.ai.errorReply }])
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
      const payload = qsTab === 'scan' && qsBase64
        ? { kind: 'client', image: qsBase64, mediaType: qsMime }
        : { kind: 'client', text: qsPaste }
      const res = await fetch('/api/os/ai/enhance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const json = await res.json() as { extracted: ScannedContact }
      setQsExtracted(json.extracted)
    } catch { setQsError(t.quickScan.errorGeneric) }
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

  const isActive = (href: string) =>
    href === '/os' ? pathname === '/os' : pathname.startsWith(href)

  return (
    <div>

      {/* ── SIDEBAR ── */}
      <nav className={`os-sidebar${mobileOpen ? ' open' : ''}`}>

        {/* Header */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--brand-border)', flexShrink: 0 }}>
          <p style={{ fontFamily: mono, fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary-text)', margin: 0, letterSpacing: '0.1em' }}>
            {t.sidebar.brand}
          </p>
          <p style={{ fontFamily: sans, fontSize: '11px', color: 'var(--brand-text-muted)', margin: '5px 0 0' }}>
            {t.sidebar.tagline}
          </p>
        </div>

        {/* Scrollable nav area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>

          <span className="os-section-label">{t.sidebar.sectionMain}</span>
          {MAIN_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`os-nav-item${isActive(item.href) ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="os-nav-icon"><Icon name={item.icon} size="md" /></span>
              <span className="os-nav-label">{item.label}</span>
            </Link>
          ))}

          <span className="os-section-label" style={{ paddingTop: '12px' }}>{t.sidebar.sectionTools}</span>
          <button
            onClick={() => { setAiOpen(true); setMobileOpen(false) }}
            className="os-nav-item"
          >
            <span className="os-nav-icon"><Icon name="lab" size="md" /></span>
            <span className="os-nav-label">{t.sidebar.toolAiAssistant}</span>
          </button>

          <div style={{ margin: '12px 16px', height: '1px', background: 'var(--brand-border)' }} />

          <span className="os-section-label" style={{ paddingTop: '4px' }}>{t.sidebar.sectionLinks}</span>
          {EXT_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="os-nav-item"
              onClick={() => setMobileOpen(false)}
            >
              <span className="os-nav-icon"><Icon name={link.icon} size="md" /></span>
              <span className="os-nav-label">{link.label}</span>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--brand-border)', flexShrink: 0 }}>
          <p style={{ fontFamily: sans, fontSize: '13px', color: 'var(--brand-text)', margin: '0 0 3px' }}>Marcel Tabit Akwe</p>
          <p style={{ fontFamily: sans, fontSize: '11px', color: 'var(--brand-text-muted)', margin: 0 }}>info@maxpromo.digital</p>
          <button onClick={logout} className="os-logout-btn">{t.sidebar.signOut}</button>
          <LanguageSwitcher />
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
        aria-label={t.sidebar.toggleMenu}
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
              background: 'var(--brand-surface-subtle)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', color: 'var(--brand-primary-text)',
              fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em',
              padding: '10px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              textTransform: 'uppercase', borderRadius: '2px',
            }}
          >
            {t.quickScan.floatingButton}
          </button>
        )}
        {!aiOpen && (
          <button
            onClick={() => setAiOpen(true)}
            style={{
              background: 'var(--brand-primary)', color: 'var(--brand-text)',
              fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em',
              border: 'none', padding: '12px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              textTransform: 'uppercase', borderRadius: '2px',
            }}
          >
            {t.ai.askButton}
          </button>
        )}
      </div>

      {/* ── AI SLIDE-OVER PANEL ── */}
      {aiOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, width: 'min(380px, 100vw)', height: '100vh',
          background: 'var(--brand-surface)', borderLeft: '1px solid var(--brand-border)',
          display: 'flex', flexDirection: 'column', zIndex: 200,
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: sans, fontWeight: 700, fontSize: '14px', color: 'var(--brand-text)', margin: 0 }}>{t.ai.title}</p>
              <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.18em', margin: '3px 0 0' }}>{t.ai.subtitle}</p>
            </div>
            <button onClick={() => setAiOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>

          {msgs.length === 0 && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--brand-border)' }}>
              <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t.ai.quickPrompts}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => sendMsg(p)} style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: sans, fontSize: '12px', padding: '9px 12px', textAlign: 'left', cursor: 'pointer', borderRadius: '2px' }}>
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
                background: msg.role === 'user' ? 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' : 'var(--brand-surface-subtle)',
                border: `1px solid ${msg.role === 'user' ? 'color-mix(in srgb, var(--brand-primary) 20%, transparent)' : 'var(--brand-border)'}`,
                padding: '10px 14px', borderRadius: '2px',
              }}>
                <p style={{ fontFamily: sans, fontSize: '13px', color: 'var(--brand-text)', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              </div>
            ))}
            {aiLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', padding: '10px 14px', borderRadius: '2px' }}>
                <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-primary-text)', margin: 0, letterSpacing: '0.2em' }}>{t.ai.thinking}</p>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--brand-border)', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input) } }}
              placeholder={t.ai.inputPlaceholder}
              style={{ flex: 1, background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: sans, fontSize: '13px', padding: '10px 12px', outline: 'none', borderRadius: '2px' }}
            />
            <button
              onClick={() => sendMsg(input)}
              disabled={aiLoading || !input.trim()}
              style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: '14px', padding: '10px 16px', cursor: 'pointer', opacity: (aiLoading || !input.trim()) ? 0.4 : 1 }}
            >
              <Icon name="send" size="md" label="Senden" />
            </button>
          </div>
        </div>
      )}

      {/* ── QUICK SCAN MODAL ── */}
      {qsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--brand-text) 45%, transparent)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', width: '100%', maxWidth: '480px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: sans, fontWeight: 700, fontSize: '15px', color: 'var(--brand-text)', margin: 0 }}>{t.quickScan.title}</p>
              <button onClick={() => setQsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--brand-border)' }}>
              {(['scan', 'paste'] as const).map(tabKey => (
                <button key={tabKey} onClick={() => { setQsTab(tabKey); qsReset() }} style={{ flex: 1, padding: '10px', background: qsTab === tabKey ? 'color-mix(in srgb, var(--brand-primary) 8%, transparent)' : 'none', border: 'none', borderBottom: qsTab === tabKey ? '2px solid var(--brand-primary)' : '2px solid transparent', color: qsTab === tabKey ? 'var(--brand-primary)' : 'var(--brand-text-muted)', fontFamily: mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  {tabKey === 'scan' ? t.quickScan.tabScan : t.quickScan.tabPaste}
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
                          style={{ width: '100%', background: 'var(--brand-background)', border: '2px dashed color-mix(in srgb, var(--brand-primary) 30%, transparent)', color: 'var(--brand-primary-text)', fontFamily: mono, fontSize: '11px', letterSpacing: '0.1em', padding: '32px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px', textAlign: 'center' }}
                        >
                          {t.quickScan.dropZone}
                          <br /><span style={{ fontSize: '10px', color: 'var(--brand-text-muted)', fontWeight: 400 }}>{t.quickScan.dropZoneFormats}</span>
                        </button>
                      ) : (
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side FileReader data: URL preview; next/image cannot optimize runtime data URLs */}
                          <img src={qsPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', border: '1px solid var(--brand-border)', borderRadius: '2px' }} />
                        </div>
                      )}
                    </div>
                  )}

                  {qsTab === 'paste' && (
                    <textarea
                      value={qsPaste}
                      onChange={e => setQsPaste(e.target.value)}
                      rows={5}
                      placeholder={t.quickScan.pastePlaceholder}
                      style={{ width: '100%', background: 'var(--brand-background)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: sans, fontSize: '13px', padding: '10px 12px', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: '12px' }}
                    />
                  )}

                  {qsError && <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--semantic-danger)', margin: '0 0 10px', letterSpacing: '0.06em' }}><Icon name="warning" size="xs" /> {qsError}</p>}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={qsExtract}
                      disabled={qsLoading || (qsTab === 'scan' ? !qsBase64 : !qsPaste.trim())}
                      style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px', opacity: qsLoading || (qsTab === 'scan' ? !qsBase64 : !qsPaste.trim()) ? 0.5 : 1 }}
                    >
                      {qsLoading ? t.quickScan.extractingButton : t.quickScan.extractButton}
                    </button>
                    {qsTab === 'scan' && qsPreview && (
                      <button onClick={() => { setQsPreview(''); setQsBase64('') }} style={{ background: 'none', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)', fontFamily: mono, fontSize: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '2px' }}>
                        {t.quickScan.remove}
                      </button>
                    )}
                  </div>
                </>
              )}

              {qsExtracted && !qsSaved && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>{t.quickScan.extractedHeading}</p>
                    <span style={{ fontFamily: mono, fontSize: '10px', color: qsExtracted.confidence === 'high' ? 'var(--semantic-success)' : qsExtracted.confidence === 'medium' ? 'var(--brand-primary)' : 'var(--semantic-danger)', background: qsExtracted.confidence === 'high' ? 'var(--semantic-success)22' : qsExtracted.confidence === 'medium' ? 'var(--brand-primary)22' : 'var(--semantic-danger)22', padding: '2px 8px', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '2px' }}>
                      {qsExtracted.confidence === 'high' ? t.quickScan.confidenceHigh : qsExtracted.confidence === 'medium' ? t.quickScan.confidenceMedium : t.quickScan.confidenceLow}
                    </span>
                  </div>
                  <div style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: '2px', padding: '14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      [t.quickScan.fieldName,    qsExtracted.name],
                      [t.quickScan.fieldCompany, qsExtracted.company],
                      [t.quickScan.fieldEmail,   qsExtracted.email],
                      [t.quickScan.fieldPhone,   qsExtracted.phone],
                      [t.quickScan.fieldAddress, qsExtracted.address],
                      [t.quickScan.fieldCity,    [qsExtracted.city, qsExtracted.postcode].filter(Boolean).join(' ')],
                      [t.quickScan.fieldCountry, qsExtracted.country],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <p key={k} style={{ fontFamily: sans, fontSize: '12px', color: 'var(--brand-text)', margin: 0 }}>
                        <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.1em', display: 'inline-block', width: '60px' }}>{k}</span>
                        {v}
                      </p>
                    ))}
                  </div>
                  {qsExtracted.confidence === 'low' && (
                    <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--semantic-danger)', margin: '0 0 12px', letterSpacing: '0.06em' }}>{t.quickScan.lowConfidenceWarning}</p>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={qsSaveClient} disabled={qsSaving} style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px', opacity: qsSaving ? 0.6 : 1 }}>
                      {qsSaving ? t.quickScan.saving : t.quickScan.saveClient}
                    </button>
                    <button onClick={qsReset} style={{ background: 'none', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)', fontFamily: mono, fontSize: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '2px' }}>
                      {t.quickScan.rescan}
                    </button>
                  </div>
                </div>
              )}

              {qsSaved && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontFamily: mono, fontSize: '14px', color: 'var(--semantic-success)', margin: '0 0 6px' }}>{t.quickScan.savedHeading}</p>
                  <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', margin: 0 }}>{qsExtracted?.name}</p>
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
}/*xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx*/
