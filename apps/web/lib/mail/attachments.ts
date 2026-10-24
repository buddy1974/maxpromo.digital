/**
 * Attachment download policy (ADR-0023). Pure: no network, no database, testable.
 *
 * Without a malware scanner in the pipeline, the protection is structural:
 *   - files that execute or render active content (HTML, SVG, scripts, installers, disk images,
 *     shortcuts) are never served, from anyone — the same list risk.ts quarantines on;
 *   - nothing from a quarantined conversation is served;
 *   - everything else is a download with a fixed, safe Content-Type; the browser never renders it
 *     inline and the name cannot inject headers or paths.
 * Opening a downloaded document is then the same act as opening it in any mail client.
 */
const ACTIVE = /\.(html?|shtml|xhtml|mht(ml)?|svgz?|xml|xsl|js|mjs|cjs|jse|vbs|vbe|wsf|wsh|hta|cmd|bat|com|cpl|ps1|psm1|scr|exe|dll|msi|msp|lnk|url|iso|img|vhdx?|jar|apk|app|dmg|pkg|reg|chm|docm|xlsm|pptm|dotm|xltm)$/i
const TYPES: Record<string, string> = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic',
  txt: 'text/plain; charset=utf-8', csv: 'text/csv; charset=utf-8', ics: 'text/calendar; charset=utf-8',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text', ods: 'application/vnd.oasis.opendocument.spreadsheet', zip: 'application/zip',
}
/** Largest attachment served. Hostinger mailboxes accept up to 25 MB per message. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

export type AttachmentPolicy = { allowed: true; contentType: string; maxBytes: number } | { allowed: false; reason: string }

export function attachmentPolicy(a: { filename: string; size: number; quarantined: boolean; located: boolean }): AttachmentPolicy {
  if (a.quarantined) return { allowed: false, reason: 'This conversation is in Spam. Its attachments are not opened.' }
  const name = a.filename.trim().toLowerCase().replace(/[.\s]+$/, '')
  if (ACTIVE.test(name)) return { allowed: false, reason: 'This file type can run code when opened and is never downloaded from the OS.' }
  if (!Number.isSafeInteger(a.size) || a.size < 0 || a.size > MAX_ATTACHMENT_BYTES) return { allowed: false, reason: 'This attachment is too large to download here.' }
  if (!a.located) return { allowed: false, reason: 'The message has not been located in the mailbox yet. Try again in a minute.' }
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
  // Declared size plus headroom for encoding differences; the stream errors beyond it.
  return { allowed: true, contentType: TYPES[ext] ?? 'application/octet-stream', maxBytes: Math.min(a.size + 64 * 1024, MAX_ATTACHMENT_BYTES + 64 * 1024) }
}

/** Always `attachment`; an ASCII fallback plus RFC 5987 UTF-8 name, no quotes, paths or controls. */
export function contentDisposition(filename: string): string {
  const clean = filename.replace(/[\u0000-\u001f\u007f"\\/:*?<>|]/g, '_').replace(/\.\.+/g, '.').trim().slice(0, 150) || 'attachment'
  const ascii = clean.replace(/[^\x20-\x7e]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(clean)}`
}
