/**
 * lib/clients/documents.ts — files kept on a client (business cards, signed offers, letters,
 * contracts). SERVER ONLY. Bytes live in os_files.content (0024), like draft attachments (0020):
 * no second storage system.
 *
 * Accepted by the bytes, not the browser's word (lib/mail/draftAttachments attachableType): PDF,
 * JPEG, PNG, WebP, GIF, Word/Excel/PowerPoint (OOXML), plain text and CSV. ≤ 4 MB per file (the
 * platform refuses larger request bodies anyway), ≤ 50 files per client. The same file twice on
 * one client is one row. Adding or removing a file is written to the client's timeline.
 * A stored document is never read by a model or acted on here.
 */
import { createHash } from 'node:crypto'
import { logActivity } from '@/lib/commercial/records'
import { CapabilityRefusal, type Sql } from '@/lib/commercial/types'
import { MAX_ATTACHMENT_BYTES, attachableType, safeFilename } from '@/lib/mail/draftAttachments'

export const MAX_CLIENT_DOCUMENT_BYTES = MAX_ATTACHMENT_BYTES
export const MAX_CLIENT_DOCUMENTS = 50

export interface ClientDocument { id: string; filename: string; mime_type: string; size_bytes: number; label: string | null; created_at: string }

export async function addClientDocument(sql: Sql, a: { clientId: string; actor: string; filename: string; bytes: Uint8Array; label?: string | null }): Promise<{ document: ClientDocument; duplicate: boolean }> {
  const filename = safeFilename(a.filename)
  if (!filename) throw new CapabilityRefusal('The file needs a normal name with an extension.')
  if (a.bytes.byteLength > MAX_CLIENT_DOCUMENT_BYTES) throw new CapabilityRefusal('Files can be at most 4 MB.')
  const type = attachableType(filename, a.bytes)
  if (!type) throw new CapabilityRefusal('This file type is not accepted (PDF, images, Office documents, text).')
  const client = await sql`SELECT id FROM os_clients WHERE id = ${a.clientId}` as unknown[]
  if (!client.length) throw new CapabilityRefusal('No client with that id.', 'not_found')
  const count = await sql`SELECT count(*)::int AS n FROM os_files WHERE client_id = ${a.clientId}` as { n: number }[]
  if (count[0].n >= MAX_CLIENT_DOCUMENTS) throw new CapabilityRefusal(`A client keeps at most ${MAX_CLIENT_DOCUMENTS} documents.`)
  const sha256 = createHash('sha256').update(a.bytes).digest('hex')
  const label = a.label?.trim().slice(0, 120) || null
  const inserted = await sql`
    INSERT INTO os_files (client_id, filename, mime_type, size_bytes, sha256, storage_ref, content, label, actor)
    VALUES (${a.clientId}, ${filename}, ${type}, ${a.bytes.byteLength}, ${sha256}, 'db', ${Buffer.from(a.bytes)}, ${label}, ${a.actor})
    ON CONFLICT DO NOTHING
    RETURNING id, filename, mime_type, size_bytes::int AS size_bytes, label, created_at` as ClientDocument[]
  if (!inserted[0]) {
    const existing = await sql`SELECT id, filename, mime_type, size_bytes::int AS size_bytes, label, created_at FROM os_files WHERE client_id = ${a.clientId} AND sha256 = ${sha256} LIMIT 1` as ClientDocument[]
    return { document: existing[0], duplicate: true }
  }
  await logActivity(sql, { client_id: a.clientId, kind: 'client_document_added', channel: 'os', actor: a.actor, summary: `Document added: ${filename}`, detail: { file_id: inserted[0].id, type, size: a.bytes.byteLength } })
  return { document: inserted[0], duplicate: false }
}

export async function listClientDocuments(sql: Sql, clientId: string): Promise<ClientDocument[]> {
  return await sql`SELECT id, filename, mime_type, size_bytes::int AS size_bytes, label, created_at FROM os_files WHERE client_id = ${clientId} ORDER BY created_at DESC LIMIT ${MAX_CLIENT_DOCUMENTS}` as ClientDocument[]
}

export async function readClientDocument(sql: Sql, clientId: string, fileId: string): Promise<{ filename: string; mime_type: string; content: Uint8Array } | null> {
  const rows = await sql`SELECT filename, mime_type, content FROM os_files WHERE id = ${fileId} AND client_id = ${clientId} AND storage_ref = 'db' AND content IS NOT NULL` as { filename: string; mime_type: string; content: Uint8Array }[]
  return rows[0] ?? null
}

export async function removeClientDocument(sql: Sql, a: { clientId: string; fileId: string; actor: string }): Promise<boolean> {
  const rows = await sql`DELETE FROM os_files WHERE id = ${a.fileId} AND client_id = ${a.clientId} RETURNING filename, sha256` as { filename: string; sha256: string }[]
  if (!rows[0]) return false
  await logActivity(sql, { client_id: a.clientId, kind: 'client_document_removed', channel: 'os', actor: a.actor, summary: `Document removed: ${rows[0].filename}`, detail: { file_id: a.fileId, sha256: rows[0].sha256 } })
  return true
}
