'use client'

import { useEffect, useState } from 'react'
import type { DocumentIdentity } from '@/lib/documents/identity'

/**
 * The business identity for document screens, loaded from the authenticated
 * `GET /api/os/document-identity` (see lib/documents/identity.ts for why it is
 * not imported). One request per page load, shared by every caller; `null`
 * until it arrives, so a document renders its own loading state rather than a
 * letterhead with holes in it.
 */
let pending: Promise<DocumentIdentity> | null = null

function load(): Promise<DocumentIdentity> {
  pending ??= fetch('/api/os/document-identity', { credentials: 'same-origin' })
    .then((r) => {
      if (!r.ok) throw new Error(`document identity: ${r.status}`)
      return r.json() as Promise<DocumentIdentity>
    })
    .catch((e) => {
      pending = null
      throw e
    })
  return pending
}

export function useDocumentIdentity(): DocumentIdentity | null {
  const [identity, setIdentity] = useState<DocumentIdentity | null>(null)
  useEffect(() => {
    let live = true
    load().then((d) => { if (live) setIdentity(d) }).catch(() => { /* stays null; the screen shows loading */ })
    return () => { live = false }
  }, [])
  return identity
}

/** Fills a dictionary line's `{taxNumber}` / `{taxOffice}` from the loaded identity; empty until it arrives. */
export function withTaxIdentity(template: string, identity: DocumentIdentity | null): string {
  if (!identity) return ''
  return template
    .replace('{taxNumber}', identity.business.steuernummer)
    .replace('{taxOffice}', identity.business.finanzamt)
}
