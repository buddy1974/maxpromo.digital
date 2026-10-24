'use client'
/**
 * The morning briefing at the top of /os: what changed since yesterday and the three things to do
 * first. Every line is a record fact (GET /api/os/briefing); empty categories are not shown.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useOsLocale } from '@/lib/os-i18n/context'
import { BRIEFING_COPY } from '@/lib/os-i18n/briefing'

interface Ref { kind: string; id: string; label?: string }
interface Line { key: string; params: Record<string, string | number>; ref?: Ref | null }
interface Snapshot { overnight: Line[]; first: { msg: { key: string; params: Record<string, string | number> }; text: string; ref: Ref | null }[]; communications: Line[]; money: Line[]; agents: Line[] }

export function hrefFor(ref: Ref | null | undefined): string | null {
  if (!ref) return null
  switch (ref.kind) {
    case 'invoice': return `/os/invoices/${ref.id}`
    case 'angebot': return `/os/angebote/${ref.id}`
    case 'lead': return '/os/leads'
    case 'client': return '/os/clients'
    case 'job': return '/os/jobs'
    case 'email_thread': return `/os/inbox?thread=${encodeURIComponent(ref.id)}`
    default: return null
  }
}

/** compact: on the dashboard, where the attention list below already ranks the actions. */
export function MorningBriefing({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useOsLocale()
  const c = BRIEFING_COPY[locale]
  const [data, setData] = useState<Snapshot | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    fetch('/api/os/briefing', { cache: 'no-store' })
      .then(async r => { if (!r.ok) throw new Error(String(r.status)); setData(await r.json() as Snapshot) })
      .catch(() => setFailed(true))
  }, [])

  if (failed) return <section className="os-briefing" aria-label={c.title}><p role="alert" className="os-briefing-note">{c.error}</p></section>
  if (!data) return <section className="os-briefing" aria-label={c.title}><p role="status" className="os-briefing-note">{c.loading}</p></section>

  const attention = t.attention.items as Record<string, (p: Record<string, string | number>) => string>
  const line = (l: Line) => (c.lines[l.key] ? c.lines[l.key](l.params) : l.key)
  // In compact form, lines the attention list states itself (overdue invoices, approvals) are left to it.
  const keep = (lines: Line[]) => (compact ? lines.filter(l => l.key !== 'overdueInvoice' && l.key !== 'approvals') : lines)
  const groups = ([['overnight', keep(data.overnight)], ['communications', keep(data.communications)], ['money', keep(data.money)], ['agents', keep(data.agents)]] as const).filter(([, lines]) => lines.length > 0)
  const first = compact ? [] : data.first
  const quiet = !first.length && !groups.length

  return (
    <section className="os-briefing" aria-label={c.title}>
      <p className="os-briefing-label">{c.title}</p>
      {quiet && <p className="os-briefing-quiet">{compact ? c.quietCompact : c.quiet}</p>}
      {first.length > 0 && (
        <div className="os-briefing-first">
          <h2>{c.first}</h2>
          <ol>
            {first.map((f, i) => {
              const href = hrefFor(f.ref)
              return <li key={i}><span>{attention[f.msg.key] ? attention[f.msg.key](f.msg.params) : f.text}</span>{href && <Link href={href}>{c.open}</Link>}</li>
            })}
          </ol>
        </div>
      )}
      {groups.length > 0 && (
        <div className="os-briefing-groups">
          {groups.map(([key, lines]) => (
            <div key={key} className="os-briefing-group">
              <h3>{c[key]}</h3>
              <ul>{lines.map((l, i) => { const href = hrefFor(l.ref); return <li key={i}>{href ? <Link href={href}>{line(l)}</Link> : line(l)}</li> })}</ul>
            </div>
          ))}
        </div>
      )}
      {data.overnight.some(l => l.key === 'newMail') && <p className="os-briefing-note">{c.external}</p>}
    </section>
  )
}
