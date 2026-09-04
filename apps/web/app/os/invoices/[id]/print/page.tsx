'use client'

import { THIRD_PARTY } from '@/lib/third-party-brands'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { InvoiceDocument } from '@/components/documents/InvoiceDocument'
import { DocumentToolbar } from '@/components/documents/DocumentPage'
import { buildInvoiceWhatsAppUrl } from '@/lib/documents/whatsapp'
import type { InvoiceData } from '@/lib/documents/types'
import { Icon } from '@maxpromo/ui'

export default function PrintPage() {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auth is enforced by middleware.ts before this page renders.
    fetch(`/api/os/invoices?id=${id}`)
      .then(r => r.json())
      .then(d => { setInvoice(d as InvoiceData); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (invoice) setTimeout(() => window.print(), 800)
  }, [invoice])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--brand-surface)', fontFamily: 'monospace', color: 'var(--brand-text-secondary)' }}>Loading invoice...</div>
  if (!invoice) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--brand-surface)', fontFamily: 'monospace', color: 'var(--brand-text-secondary)' }}>Invoice not found.</div>

  return (
    <InvoiceDocument
      invoice={invoice}
      withFilename
      toolbar={
        <DocumentToolbar>
          <button
            onClick={() => window.print()}
            style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            <Icon name="download" size="sm" /> Als PDF speichern
          </button>
          <a
            href={buildInvoiceWhatsAppUrl(invoice)}
            target="_blank"
            rel="noopener noreferrer"
            /* #25D366 is WhatsApp's own brand colour, not ours: a third-party
               button has to look like that platform's button to be recognised.
               Deliberately literal, and the only hex left in app/os. */
            style={{ background: THIRD_PARTY.whatsapp, color: 'var(--brand-text)', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', textDecoration: 'none', display: 'inline-block', textTransform: 'uppercase' }}
          >
            <Icon name="message" size="sm" /> Per WhatsApp senden
          </a>
          <button
            onClick={() => window.close()}
            style={{ background: 'none', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: 'monospace', fontSize: '11px', padding: '10px 14px', cursor: 'pointer' }}
          >
            Close
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--brand-text-muted)', marginLeft: 'auto' }}>
            WhatsApp: message pre-filled — attach the PDF manually before sending
          </span>
        </DocumentToolbar>
      }
    />
  )
}
