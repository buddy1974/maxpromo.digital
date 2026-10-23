'use client'
/**
 * "What needs Marcel's attention today" — the head of the /os dashboard
 * (ADR-0021). One read of /api/os/attention: the same attention model the
 * brief and the notices use, so the screen and the phone never disagree.
 *
 * Shows ranked items across sales, money, clients, system and agents; the
 * approvals waiting for him; email needing a reply; and what the Agent Bureau
 * reported. Agent and email text is external content: rendered as text only.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { TONE_VARS } from '@maxpromo/ui'
import { useOsLocale } from '@/lib/os-i18n/context'

const mono = 'var(--brand-font-mono)'
const sans = 'var(--brand-font-body)'

type Area = 'SALES' | 'MONEY' | 'CLIENT' | 'SYSTEM' | 'AGENT'
interface Ref { kind: string; id: string; label?: string }
interface Snapshot {
  counts: Record<Area, number>
  items: { area: Area; text: string; action: string; urgency: number; ref: Ref | null }[]
  email: { id: string; subject: string; classification: string; needsReply: boolean }[]
  approvals: { id: string; summary: string }[]
  agentEvents: { id: string; agent: string; kind: string; severity: string; title: string; detail: string | null }[]
}

/** Where a referenced record opens in the OS. */
function hrefFor(ref: Ref | null): string | null {
  if (!ref) return null
  switch (ref.kind) {
    case 'invoice': return `/os/invoices/${ref.id}`
    case 'angebot': return `/os/angebote/${ref.id}`
    case 'lead': return '/os/leads'
    case 'client': return '/os/clients'
    case 'job': return '/os/jobs'
    case 'email_thread': return '/os/inbox'
    default: return null
  }
}

const URGENCY_TONE = { 3: 'critical', 2: 'caution', 1: 'neutral' } as const

export function AttentionPanel() {
  const { t } = useOsLocale()
  const a = t.attention
  const [data, setData] = useState<Snapshot | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    fetch('/api/os/attention', { cache: 'no-store' })
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); setData(await r.json() as Snapshot); setFailed(false) })
      .catch(() => setFailed(true))
  }, [])
  useEffect(() => { load() }, [load])

  async function acknowledge(id: string) {
    const r = await fetch('/api/os/attention', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acknowledge: id }) })
    if (r.ok) setData((d) => d ? {
      ...d,
      agentEvents: d.agentEvents.filter((e) => e.id !== id),
      counts: { ...d.counts, AGENT: Math.max(0, d.counts.AGENT - 1) },
    } : d)
  }

  const box = { background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', padding: '20px 24px' }
  const label = { fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, margin: '0 0 12px' }

  if (failed) return <section aria-label={a.title} style={box}><p style={label}>{a.title}</p><p role="alert" style={{ fontFamily: sans, margin: 0 }}>{a.error}</p></section>
  if (!data) return <section aria-label={a.title} style={box}><p style={label}>{a.title}</p><p role="status" style={{ fontFamily: sans, margin: 0, color: 'var(--brand-text-muted)' }}>{a.loading}</p></section>

  /* Agent events and the approval count have their own rows above and below. */
  const items = data.items.filter((i) => i.area !== 'AGENT' && i.action !== 'What needs my approval?').slice(0, 8)
  const replies = data.email.filter((e) => e.needsReply)
  const quiet = items.length === 0 && data.approvals.length === 0 && replies.length === 0 && data.agentEvents.length === 0
  const areas = (Object.keys(data.counts) as Area[]).filter((k) => data.counts[k] > 0)

  return (
    <section aria-label={a.title} style={{ ...box, marginBottom: '28px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
        <h2 style={{ ...label, margin: 0 }}>{a.title}</h2>
        {areas.length > 0 && (
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', margin: 0 }}>
            {areas.map((k) => `${data.counts[k]} ${a[`area${k}` as const]}`).join(' · ')}
          </p>
        )}
      </div>

      {quiet && <p style={{ fontFamily: sans, color: 'var(--brand-text-secondary)', margin: '12px 0 0' }}>{a.nothing}</p>}

      {(data.approvals.length > 0 || replies.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
          {data.approvals.length > 0 && (
            <Link href="/os/approvals" className="btn-primary btn-sm">{a.approvals(data.approvals.length)}</Link>
          )}
          {replies.length > 0 && (
            <Link href="/os/inbox" className="btn-secondary btn-sm">{a.email(replies.length)}</Link>
          )}
        </div>
      )}

      {items.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'grid', gap: '8px' }}>
          {items.map((i, n) => {
            const href = hrefFor(i.ref)
            const tone = TONE_VARS[URGENCY_TONE[(i.urgency as 1 | 2 | 3)] ?? 'neutral'].text
            return (
              <li key={n} style={{ display: 'flex', gap: '10px', alignItems: 'baseline', minWidth: 0 }}>
                <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: tone, minWidth: '64px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{a[`area${i.area}` as const]}</span>
                <span style={{ fontFamily: sans, fontSize: '14px', color: 'var(--brand-text)', overflowWrap: 'anywhere', flex: 1 }}>{i.text}</span>
                {href && <Link href={href} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)' }}>{a.open}</Link>}
              </li>
            )
          })}
        </ul>
      )}

      {data.agentEvents.length > 0 && (
        <div style={{ marginTop: '18px', borderTop: '1px solid var(--brand-border)', paddingTop: '14px' }}>
          <p style={label}>{a.agentEvents}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
            {data.agentEvents.map((e) => (
              <li key={e.id} style={{ display: 'flex', gap: '10px', alignItems: 'baseline', minWidth: 0 }}>
                <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: TONE_VARS[e.severity === 'critical' ? 'critical' : e.severity === 'warning' ? 'caution' : 'neutral'].text, minWidth: '64px' }}>{e.agent}</span>
                <span style={{ fontFamily: sans, fontSize: '14px', color: 'var(--brand-text)', overflowWrap: 'anywhere', flex: 1 }}>
                  {e.title}{e.detail ? <span style={{ display: 'block', color: 'var(--brand-text-muted)', fontSize: '12px' }}>{e.detail}</span> : null}
                </span>
                <button type="button" onClick={() => void acknowledge(e.id)} className="btn-secondary btn-sm">{a.acknowledge}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(data.agentEvents.length > 0 || replies.length > 0) && (
        <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: '14px 0 0' }}>{a.externalNote}</p>
      )}
    </section>
  )
}
