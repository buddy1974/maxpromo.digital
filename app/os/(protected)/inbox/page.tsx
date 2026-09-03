'use client'
import { useEffect, useState } from 'react'
import { useOsLocale } from '@/lib/os-i18n/context'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

// Inbox shows a communication log built from the os_leads table (recent activity)
// and a manual log of key sent communications.

type LogType = 'invoice_sent' | 'angebot_sent' | 'lead_enquiry' | 'newsletter' | 'other'
type LogStatus = 'received' | 'sent'

interface LogEntry {
  id: string
  date: string
  from: string
  subject: string
  type: LogType
  status: LogStatus
  ref?: string
}

const TYPE_COLOR: Record<LogType, string> = {
  invoice_sent:  '#22c55e',
  angebot_sent:  '#3b82f6',
  lead_enquiry:  'var(--brand-primary)',
  newsletter:    '#a855f7',
  other:         '#555',
}

interface Lead { id: string; name: string; email: string; source: string; created_at: string; company: string }
interface Invoice { id: string; invoice_number: string; client_name: string; sent_at: string; client_email: string }

export default function InboxPage() {
  const { t, intlLocale, fmtDate } = useOsLocale()
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/os/leads').then(r => r.json()),
      fetch('/api/os/invoices').then(r => r.json()),
    ]).then(([lds, invs]) => {
      setLeads(Array.isArray(lds) ? lds : [])
      setInvoices(Array.isArray(invs) ? invs.filter((i: Invoice) => i.sent_at) : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const typeLabel: Record<LogType, string> = {
    invoice_sent: t.inbox.typeInvoiceSent,
    angebot_sent: t.inbox.typeAngebotSent,
    lead_enquiry: t.inbox.typeLeadEnquiry,
    newsletter:   t.inbox.typeNewsletter,
    other:        t.inbox.typeOther,
  }
  const statusLabel: Record<LogStatus, string> = {
    received: t.inbox.statusReceived,
    sent:     t.inbox.statusSent,
  }

  // Build unified log from leads + sent invoices
  const log: LogEntry[] = [
    ...leads.map(l => ({
      id: l.id,
      date: l.created_at,
      from: l.email || l.name || l.company || t.inbox.unknown,
      subject: `${t.status.leadSource[l.source] ?? l.source?.replace(/_/g, ' ') ?? ''} — ${l.name || l.company || t.inbox.anonymous}`,
      type: 'lead_enquiry' as const,
      status: 'received' as const,
      ref: l.id,
    })),
    ...invoices.map(i => ({
      id: i.id,
      date: i.sent_at,
      from: 'info@maxpromo.digital',
      subject: t.inbox.invoiceSubject(i.invoice_number, i.client_name),
      type: 'invoice_sent' as const,
      status: 'sent' as const,
      ref: i.id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const columns = [t.inbox.colDate, t.inbox.colFromTo, t.inbox.colSubject, t.inbox.colType, t.inbox.colStatus]

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>{t.inbox.heading}</h1>
        <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>
          {t.inbox.subtitle} &nbsp;·&nbsp; {log.length} {t.inbox.entries}
        </p>
      </div>

      <div style={{ background: 'color-mix(in srgb, var(--brand-primary) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent)', padding: '12px 18px', marginBottom: '24px' }}>
        <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', margin: 0, letterSpacing: '0.06em', lineHeight: 1.6 }}>
          {t.inbox.note1}<br />
          {t.inbox.note2} <code style={{ color: 'var(--brand-primary)' }}>/api/os/inbox</code>
        </p>
      </div>

      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid var(--brand-primary)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {columns.map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: '#333' }}>{t.common.loading}</td></tr>
            ) : log.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: '#444' }}>{t.inbox.empty}</td></tr>
            ) : (
              log.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '11px 16px', fontFamily: mono, fontSize: '11px', color: '#555', whiteSpace: 'nowrap' }}>
                    {fmtDate(entry.date)}<br />
                    <span style={{ fontSize: '10px', color: '#333' }}>
                      {new Date(entry.date).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', fontFamily: mono, fontSize: '11px', color: '#888', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.from}
                  </td>
                  <td style={{ padding: '11px 16px', fontFamily: sans, fontSize: '13px', color: '#FFF' }}>
                    {entry.subject}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: TYPE_COLOR[entry.type], background: TYPE_COLOR[entry.type] + '20', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>
                      {typeLabel[entry.type]}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: entry.status === 'sent' ? '#22c55e' : '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {statusLabel[entry.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
