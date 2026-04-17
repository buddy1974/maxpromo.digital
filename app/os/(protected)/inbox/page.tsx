'use client'
import { useEffect, useState } from 'react'

const mono    = 'var(--font-space-mono)'
const grotesk = 'var(--font-space-grotesk)'
const sans    = 'var(--font-dm-sans)'

// Inbox shows a communication log built from the os_leads table (recent activity)
// and a manual log of key sent communications.

interface LogEntry {
  id: string
  date: string
  from: string
  subject: string
  type: 'invoice_sent' | 'angebot_sent' | 'lead_enquiry' | 'newsletter' | 'other'
  status: string
  ref?: string
}

const TYPE_LABEL: Record<string, string> = {
  invoice_sent:  'Invoice Sent',
  angebot_sent:  'Angebot Sent',
  lead_enquiry:  'Lead Enquiry',
  newsletter:    'Newsletter',
  other:         'Other',
}

const TYPE_COLOR: Record<string, string> = {
  invoice_sent:  '#22c55e',
  angebot_sent:  '#3b82f6',
  lead_enquiry:  '#F97316',
  newsletter:    '#a855f7',
  other:         '#555',
}

interface Lead { id: string; name: string; email: string; source: string; created_at: string; company: string }
interface Invoice { id: string; invoice_number: string; client_name: string; sent_at: string; client_email: string }

export default function InboxPage() {
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

  // Build unified log from leads + sent invoices
  const log: LogEntry[] = [
    ...leads.map(l => ({
      id: l.id,
      date: l.created_at,
      from: l.email || l.name || l.company || 'Unknown',
      subject: `${l.source?.replace(/_/g,' ')} — ${l.name || l.company || 'Anonymous'}`,
      type: 'lead_enquiry' as const,
      status: 'received',
      ref: l.id,
    })),
    ...invoices.map(i => ({
      id: i.id,
      date: i.sent_at,
      from: 'info@maxpromo.digital',
      subject: `Rechnung ${i.invoice_number} → ${i.client_name}`,
      type: 'invoice_sent' as const,
      status: 'sent',
      ref: i.id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Inbox</h1>
        <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>
          Communication log &nbsp;·&nbsp; {log.length} entries
        </p>
      </div>

      <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', padding: '12px 18px', marginBottom: '24px' }}>
        <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', margin: 0, letterSpacing: '0.06em', lineHeight: 1.6 }}>
          This log aggregates lead enquiries from all website forms + sent invoices.<br />
          For full email inbox, connect Resend inbound webhook to <code style={{ color: '#F97316' }}>/api/os/inbox</code>
        </p>
      </div>

      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #F97316', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Date', 'From / To', 'Subject', 'Type', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: '#333' }}>Loading...</td></tr>
            ) : log.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: '#444' }}>No communications yet. They&apos;ll appear here as leads come in and invoices are sent.</td></tr>
            ) : (
              log.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '11px 16px', fontFamily: mono, fontSize: '11px', color: '#555', whiteSpace: 'nowrap' }}>
                    {new Date(entry.date).toLocaleDateString('de-DE')}<br />
                    <span style={{ fontSize: '10px', color: '#333' }}>{new Date(entry.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td style={{ padding: '11px 16px', fontFamily: mono, fontSize: '11px', color: '#888', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.from}
                  </td>
                  <td style={{ padding: '11px 16px', fontFamily: sans, fontSize: '13px', color: '#FFF' }}>
                    {entry.subject}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: TYPE_COLOR[entry.type] ?? '#555', background: (TYPE_COLOR[entry.type] ?? '#555') + '20', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>
                      {TYPE_LABEL[entry.type]}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: entry.status === 'sent' ? '#22c55e' : '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {entry.status}
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
