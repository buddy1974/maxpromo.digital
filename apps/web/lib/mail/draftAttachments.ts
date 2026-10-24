/**
 * Files attached to an email Marcel is writing (migration 0020). SERVER ONLY.
 *
 * What is accepted is decided by the bytes, not by the browser's word: the declared type must be
 * on the allowlist AND the file must start the way that type starts (PDF, PNG, JPEG, GIF, WebP,
 * Office Open XML) or be valid UTF-8 text without NUL bytes (txt, csv). Executables, scripts, HTML,
 * SVG and archives are never attachable. 4 MB per file, 10 MB per draft, 10 files per draft.
 *
 * Adding or removing a file changes the draft's revision and supersedes a waiting confirmation,
 * so Marcel always confirms the exact set of files that leaves. After a confirmed send the bytes
 * are cleared: the Sent folder copy is the record.
 */
import { createHash } from 'node:crypto'
import { CapabilityRefusal, type Sql } from '@/lib/commercial/types'

export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024
export const MAX_DRAFT_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const MAX_DRAFT_ATTACHMENTS = 10

const OOXML: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}
export const ATTACHABLE: Record<string, string> = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  txt: 'text/plain', csv: 'text/csv', ...OOXML,
}

const starts = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v)

/** Safe display/send name: no path, no control characters, no leading dots, bounded. */
export function safeFilename(name: string): string | null {
  const base = name.split(/[\\/]/).pop()!.normalize('NFC').replace(/[\u0000-\u001f\u007f"<>|:*?]/g, '').replace(/^\.+/, '').trim().slice(0, 200)
  return base && /\.[A-Za-z0-9]{2,5}$/.test(base) ? base : null
}

/** The content type the file really is, or null when it is not attachable. */
export function attachableType(filename: string, bytes: Uint8Array): string | null {
  const ext = filename.split('.').pop()!.toLowerCase()
  const type = ATTACHABLE[ext]
  if (!type || bytes.byteLength === 0) return null
  const ok =
    type === 'application/pdf' ? starts(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]) :
    type === 'image/png' ? starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) :
    type === 'image/jpeg' ? starts(bytes, [0xff, 0xd8, 0xff]) :
    type === 'image/gif' ? starts(bytes, [0x47, 0x49, 0x46, 0x38]) :
    type === 'image/webp' ? starts(bytes, [0x52, 0x49, 0x46, 0x46]) && starts(bytes, [0x57, 0x45, 0x42, 0x50], 8) :
    Object.values(OOXML).includes(type) ? starts(bytes, [0x50, 0x4b, 0x03, 0x04]) :
    (() => { if (bytes.includes(0)) return false; try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); return true } catch { return false } })()
  return ok ? type : null
}

export interface DraftAttachment { id: string; filename: string; content_type: string; size_bytes: number; sha256: string; source: string }

async function ownedOpenDraft(sql: Sql, draftId: string, actor: string) {
  const rows = await sql`SELECT id FROM mail.drafts WHERE id=${draftId}::uuid AND status='draft' AND created_by=${actor}` as { id: string }[]
  if (!rows[0]) throw new CapabilityRefusal('This draft was sent or discarded.', 'conflict')
}

/** A changed set of files is a changed email: new revision, waiting confirmation superseded. */
async function bumpRevision(sql: Sql, draftId: string, actor: string) {
  await sql`UPDATE mail.drafts SET revision=revision+1,updated_at=now() WHERE id=${draftId}::uuid AND status='draft'`
  await sql`UPDATE os_approvals SET status='superseded',decided_at=now(),decided_by=${actor} WHERE dedupe_key=${`email.deliver:draft:${draftId}`} AND status='pending'`
}

export async function addDraftAttachment(sql: Sql, a: { draftId: string; actor: string; filename: string; bytes: Uint8Array; source?: 'upload' | 'invoice' | 'angebot'; sourceId?: string | null }): Promise<DraftAttachment> {
  const filename = safeFilename(a.filename)
  if (!filename) throw new CapabilityRefusal('That file name cannot be sent.')
  if (a.bytes.byteLength > MAX_ATTACHMENT_BYTES) throw new CapabilityRefusal('Files can be at most 4 MB.')
  const type = attachableType(filename, a.bytes)
  if (!type) throw new CapabilityRefusal('Only PDF, images, text, CSV and Word/Excel/PowerPoint files can be attached — and the file must really be one.')
  await ownedOpenDraft(sql, a.draftId, a.actor)
  const sha256 = createHash('sha256').update(a.bytes).digest('hex')
  const totals = await sql`SELECT count(*)::int AS n, coalesce(sum(size_bytes),0)::bigint AS bytes FROM mail.draft_attachments WHERE draft_id=${a.draftId}::uuid AND sha256<>${sha256}` as { n: number; bytes: string }[]
  if (totals[0].n >= MAX_DRAFT_ATTACHMENTS) throw new CapabilityRefusal('At most 10 files per email.')
  if (Number(totals[0].bytes) + a.bytes.byteLength > MAX_DRAFT_ATTACHMENT_BYTES) throw new CapabilityRefusal('All files together can be at most 10 MB.')
  const rows = await sql`
    INSERT INTO mail.draft_attachments (draft_id, created_by, filename, content_type, size_bytes, sha256, source, source_id, content)
    VALUES (${a.draftId}::uuid, ${a.actor}, ${filename}, ${type}, ${a.bytes.byteLength}, ${sha256}, ${a.source ?? 'upload'}, ${a.sourceId ?? null}::uuid, ${Buffer.from(a.bytes)})
    ON CONFLICT (draft_id, sha256) DO NOTHING
    RETURNING id, filename, content_type, size_bytes, sha256, source` as DraftAttachment[]
  if (rows[0]) { await bumpRevision(sql, a.draftId, a.actor); return rows[0] }
  const same = await sql`SELECT id, filename, content_type, size_bytes, sha256, source FROM mail.draft_attachments WHERE draft_id=${a.draftId}::uuid AND sha256=${sha256}` as DraftAttachment[]
  return same[0]
}

export async function removeDraftAttachment(sql: Sql, draftId: string, attachmentId: string, actor: string): Promise<boolean> {
  await ownedOpenDraft(sql, draftId, actor)
  const rows = await sql`DELETE FROM mail.draft_attachments WHERE id=${attachmentId}::uuid AND draft_id=${draftId}::uuid RETURNING id` as { id: string }[]
  if (rows.length) await bumpRevision(sql, draftId, actor)
  return rows.length > 0
}

export async function listDraftAttachments(sql: Sql, draftId: string): Promise<DraftAttachment[]> {
  try {
    return await sql`SELECT id, filename, content_type, size_bytes, sha256, source FROM mail.draft_attachments WHERE draft_id=${draftId}::uuid ORDER BY created_at` as DraftAttachment[]
  } catch (error) {
    // Optional until migration 0020 exists.
    if (typeof error === 'object' && error !== null && 'code' in error && ['42P01', '3F000'].includes(String(error.code))) return []
    throw error
  }
}

/** The files as the mail server takes them, for the send. */
export async function draftAttachmentPayload(sql: Sql, draftId: string): Promise<{ meta: { filename: string; contentType: string; size: number }[]; send: { filename: string; content: string; contentType: string; encoding: string }[] }> {
  let rows: { filename: string; content_type: string; size_bytes: number; content: Uint8Array | null }[] = []
  try {
    rows = await sql`SELECT filename, content_type, size_bytes, content FROM mail.draft_attachments WHERE draft_id=${draftId}::uuid ORDER BY created_at` as typeof rows
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && ['42P01', '3F000'].includes(String(error.code))) return { meta: [], send: [] }
    throw error
  }
  if (rows.some(r => !r.content)) throw new CapabilityRefusal('An attached file is no longer available. Remove it and attach it again.')
  return {
    meta: rows.map(r => ({ filename: r.filename, contentType: r.content_type, size: r.size_bytes })),
    send: rows.map(r => ({ filename: r.filename, content: Buffer.from(r.content!).toString('base64'), contentType: r.content_type, encoding: 'base64' })),
  }
}
