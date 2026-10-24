/**
 * Email text with its web links usable — safely. Inbound HTML is never rendered (ADR-0023); this
 * only turns plain-text https:// addresses into links:
 *   - https only (an http://, javascript:, data: or mailto: address stays text)
 *   - the visible text IS the destination: a link can never show one address and open another
 *   - opens in a new tab with noopener noreferrer nofollow (no window access, no referrer leak)
 *   - trailing punctuation from the sentence is not part of the link
 */
const URL_RE = /https:\/\/[^\s<>"'`]+/g
const TRAILING = /[.,;:!?)\]}»”'"]+$/

export function linkParts(text: string): Array<{ text: string; href?: string }> {
  const parts: Array<{ text: string; href?: string }> = []
  let last = 0
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index ?? 0
    let raw = m[0]
    const trail = raw.match(TRAILING)?.[0] ?? ''
    if (trail) raw = raw.slice(0, raw.length - trail.length)
    let href: string | undefined
    try { const u = new URL(raw); if (u.protocol === 'https:' && u.hostname.includes('.')) href = u.href } catch { href = undefined }
    if (start > last) parts.push({ text: text.slice(last, start) })
    parts.push(href ? { text: raw, href } : { text: raw })
    if (trail) parts.push({ text: trail })
    last = start + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

export function LinkifiedText({ text }: { text: string }) {
  return (
    <>
      {linkParts(text).map((p, i) => (p.href
        ? <a key={i} href={p.href} target="_blank" rel="noopener noreferrer nofollow" className="mail-inline-link">{p.text}</a>
        : <span key={i}>{p.text}</span>))}
    </>
  )
}
