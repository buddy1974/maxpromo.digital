'use client'

import { THIRD_PARTY } from '@/lib/third-party-brands'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AngebotDocument } from '@/components/documents/AngebotDocument'
import { DocumentToolbar } from '@/components/documents/DocumentPage'
import { buildAngebotWhatsAppUrl } from '@/lib/documents/whatsapp'
import type { AngebotData } from '@/lib/documents/types'

export default function AngebotPrintPage() {
  const { id } = useParams<{ id: string }>()
  const [angebot, setAngebot] = useState<AngebotData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auth is already enforced by middleware.ts before this page renders.
    fetch(`/api/os/angebote?id=${id}`)
      .then(r => r.json())
      .then(d => { setAngebot(d as AngebotData); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (angebot) setTimeout(() => window.print(), 800)
  }, [angebot])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--brand-surface)', fontFamily: 'monospace', color: 'var(--brand-text-secondary)' }}>Loading angebot...</div>
  if (!angebot) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--brand-surface)', fontFamily: 'monospace', color: 'var(--brand-text-secondary)' }}>Angebot not found.</div>

  return (
    <AngebotDocument
      angebot={angebot}
      withFilename
      toolbar={
        <DocumentToolbar>
          <button
            onClick={() => window.print()}
            style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            ▤ Als PDF speichern
          </button>
          {/*
            WhatsApp Click-to-Chat URLs only support text — there's no API
            to attach a file. The page already auto-triggers print on load
            (PDF lands in Downloads). This button just opens the chat with
            the message pre-filled; the user drags the PDF in afterwards.
          */}
          <a
            href={buildAngebotWhatsAppUrl(angebot)}
            target="_blank"
            rel="noopener noreferrer"
            /* #25D366 is WhatsApp's own brand colour, not ours: a third-party
               button has to look like that platform's button to be recognised.
               Deliberately literal, and the only hex left in app/os. */
            style={{ background: THIRD_PARTY.whatsapp, color: 'var(--brand-text)', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', textDecoration: 'none', display: 'inline-block', textTransform: 'uppercase' }}
          >
            ▭ WhatsApp text
          </a>
          <button
            onClick={() => window.close()}
            style={{ background: 'none', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: 'monospace', fontSize: '11px', padding: '10px 14px', cursor: 'pointer' }}
          >
            Close
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--brand-text-secondary)', marginLeft: 'auto', maxWidth: '380px', textAlign: 'right', lineHeight: 1.5 }}>
            WhatsApp can&apos;t auto-attach files. PDF saves to Downloads — drag it into the chat after the text is pre-filled.
          </span>
        </DocumentToolbar>
      }
    />
  )
}
