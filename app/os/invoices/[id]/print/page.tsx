'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { InvoiceDocument } from '@/components/documents/InvoiceDocument'
import { DocumentToolbar } from '@/components/documents/DocumentPage'
import { buildInvoiceWhatsAppUrl } from '@/lib/documents/whatsapp'
import type { InvoiceData } from '@/lib/documents/types'

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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', fontFamily: 'monospace', color: '#888' }}>Loading invoice...</div>
  if (!invoice) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', fontFamily: 'monospace', color: '#888' }}>Invoice not found.</div>

  return (
    <InvoiceDocument
      invoice={invoice}
      withFilename
      toolbar={
        <DocumentToolbar>
          <button
            onClick={() => window.print()}
            style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            📄 Als PDF speichern
          </button>
          <a
            href={buildInvoiceWhatsAppUrl(invoice)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#25D366', color: '#FFF', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', textDecoration: 'none', display: 'inline-block', textTransform: 'uppercase' }}
          >
            💬 Per WhatsApp senden
          </a>
          <button
            onClick={() => window.close()}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#888', fontFamily: 'monospace', fontSize: '11px', padding: '10px 14px', cursor: 'pointer' }}
          >
            Close
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#555', marginLeft: 'auto' }}>
            WhatsApp: message pre-filled — attach the PDF manually before sending
          </span>
        </DocumentToolbar>
      }
    />
  )
}
