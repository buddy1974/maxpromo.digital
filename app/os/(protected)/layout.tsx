'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const mono = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans = 'var(--font-inter)'

const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard',    href: '/os' },
  { icon: '◐', label: 'Clients',      href: '/os/clients' },
  { icon: '◻', label: 'Invoices',     href: '/os/invoices' },
  { icon: '▦', label: 'Angebote',     href: '/os/angebote' },
  { icon: '◈', label: 'Jobs / Kanban', href: '/os/jobs' },
  { icon: '●', label: 'Leads',        href: '/os/leads' },
  { icon: '▷', label: 'Newsletter',   href: '/os/newsletter' },
  { icon: '◁', label: 'Inbox',        href: '/os/inbox' },
]

const EXT_LINKS = [
  { icon: '↗', label: 'maxpromo.digital',  href: 'https://maxpromo.digital' },
  { icon: '↗', label: 'Automation Audit',  href: '/automation-audit' },
  { icon: '↗', label: 'Estimate Tool',     href: '/estimate' },
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
  const [auth, setAuth]         = useState<boolean | null>(null)
  const [aiOpen, setAiOpen]     = useState(false)
  const [msgs, setMsgs]         = useState<AIMsg[]>([])
  const [input, setInput]       = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

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

  if (!auth) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0A0A0A' }}>
        <span style={{ fontFamily:mono, fontSize:'10px', color:'#F97316', letterSpacing:'0.3em' }}>LOADING...</span>
      </div>
    )
  }

  const isActive = (href: string) =>
    href === '/os' ? pathname === '/os' : pathname.startsWith(href)

  const navItem = (item: typeof NAV_ITEMS[0]) => (
    <Link
      key={item.href}
      href={item.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 16px',
        color: isActive(item.href) ? '#FFFFFF' : '#555555',
        fontFamily: mono,
        fontSize: '11px',
        letterSpacing: '0.04em',
        textDecoration: 'none',
        borderLeft: isActive(item.href) ? '2px solid #F97316' : '2px solid transparent',
        background: isActive(item.href) ? 'rgba(249,115,22,0.06)' : 'transparent',
      }}
    >
      <span style={{ fontSize: '13px', width: '16px', textAlign: 'center', opacity: isActive(item.href) ? 1 : 0.5 }}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

      {/* ── SIDEBAR ── */}
      <nav style={{
        width: '240px',
        flexShrink: 0,
        background: '#0D0D0D',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
          <p style={{ fontFamily:grotesk, fontSize:'15px', fontWeight:700, color:'#FFFFFF', margin:0, letterSpacing:'-0.02em' }}>
            MaxPromo <span style={{ color:'#F97316' }}>OS</span>
          </p>
          <p style={{ fontFamily:mono, fontSize:'9px', color:'#444', letterSpacing:'0.2em', textTransform:'uppercase', margin:'5px 0 0' }}>
            Business Operating System
          </p>
        </div>

        {/* Nav items */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          {NAV_ITEMS.map(navItem)}

          <div style={{ margin:'10px 16px', height:'1px', background:'rgba(255,255,255,0.04)' }} />

          {EXT_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:'10px', padding:'7px 16px', color:'#3d3d3d', fontFamily:mono, fontSize:'10px', letterSpacing:'0.04em', textDecoration:'none' }}
            >
              <span style={{ fontSize:'11px', width:'16px', textAlign:'center' }}>{link.icon}</span>
              {link.label}
            </a>
          ))}

          <div style={{ margin:'10px 16px', height:'1px', background:'rgba(255,255,255,0.04)' }} />

          <button
            onClick={logout}
            style={{ display:'flex', alignItems:'center', gap:'10px', padding:'7px 16px', color:'#3d3d3d', fontFamily:mono, fontSize:'10px', letterSpacing:'0.04em', background:'none', border:'none', cursor:'pointer', width:'100%' }}
          >
            <span style={{ fontSize:'13px', width:'16px', textAlign:'center' }}>⊗</span>
            Logout
          </button>
        </div>

        {/* User */}
        <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          <p style={{ fontFamily:sans, fontSize:'12px', color:'#888', margin:'0 0 2px' }}>Marcel Tabit Akwe</p>
          <p style={{ fontFamily:mono, fontSize:'10px', color:'#3d3d3d', margin:0 }}>info@maxpromo.digital</p>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, overflow:'auto', background:'#0A0A0A', position:'relative' }}>
        {children}
      </main>

      {/* ── AI FLOATING BUTTON ── */}
      {!aiOpen && (
        <button
          onClick={() => setAiOpen(true)}
          style={{
            position:'fixed', bottom:'24px', right:'24px',
            background:'#F97316', color:'#000',
            fontFamily:mono, fontWeight:700, fontSize:'11px', letterSpacing:'0.12em',
            border:'none', padding:'12px 18px', cursor:'pointer', zIndex:100,
            display:'flex', alignItems:'center', gap:'8px',
            textTransform:'uppercase',
          }}
        >
          ◈ Ask AI
        </button>
      )}

      {/* ── AI SLIDE-OVER PANEL ── */}
      {aiOpen && (
        <div style={{
          position:'fixed', top:0, right:0, width:'380px', height:'100vh',
          background:'#0D0D0D', borderLeft:'1px solid rgba(255,255,255,0.07)',
          display:'flex', flexDirection:'column', zIndex:200,
        }}>
          {/* Header */}
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontFamily:grotesk, fontWeight:700, fontSize:'14px', color:'#FFF', margin:0 }}>AI Assistant</p>
              <p style={{ fontFamily:mono, fontSize:'9px', color:'#444', letterSpacing:'0.18em', margin:'3px 0 0' }}>CLAUDE SONNET 4.6</p>
            </div>
            <button onClick={() => setAiOpen(false)} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:'20px', lineHeight:1 }}>×</button>
          </div>

          {/* Quick prompts */}
          {msgs.length === 0 && (
            <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontFamily:mono, fontSize:'9px', color:'#444', letterSpacing:'0.18em', textTransform:'uppercase', margin:'0 0 10px' }}>Quick prompts</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => sendMsg(p)} style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', color:'#777', fontFamily:sans, fontSize:'12px', padding:'9px 12px', textAlign:'left', cursor:'pointer', borderRadius:'2px' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {msgs.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: msg.role === 'user' ? 'rgba(249,115,22,0.1)' : '#111111',
                border: `1px solid ${msg.role === 'user' ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)'}`,
                padding: '10px 14px',
                borderRadius: '2px',
              }}>
                <p style={{ fontFamily:sans, fontSize:'13px', color:'#CCC', margin:0, lineHeight:1.65, whiteSpace:'pre-wrap' }}>{msg.content}</p>
              </div>
            ))}
            {aiLoading && (
              <div style={{ alignSelf:'flex-start', background:'#111', border:'1px solid rgba(255,255,255,0.06)', padding:'10px 14px', borderRadius:'2px' }}>
                <p style={{ fontFamily:mono, fontSize:'10px', color:'#F97316', margin:0, letterSpacing:'0.2em' }}>thinking...</p>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:'8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input) } }}
              placeholder="Ask anything..."
              style={{ flex:1, background:'#111', border:'1px solid rgba(255,255,255,0.08)', color:'#FFF', fontFamily:sans, fontSize:'13px', padding:'10px 12px', outline:'none', borderRadius:'2px' }}
            />
            <button
              onClick={() => sendMsg(input)}
              disabled={aiLoading || !input.trim()}
              style={{ background:'#F97316', border:'none', color:'#000', fontFamily:mono, fontWeight:700, fontSize:'14px', padding:'10px 16px', cursor:'pointer', opacity:(aiLoading || !input.trim()) ? 0.4 : 1 }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
