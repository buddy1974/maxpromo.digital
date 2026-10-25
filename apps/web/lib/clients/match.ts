/**
 * lib/clients/match.ts — "is this a client we already have?" One primitive for every caller: the
 * client form, extraction from a document, quotes and invoices, leads, and later Universal Max.
 *
 * Deterministic business evidence only. No model, no fuzzy similarity score, and never a merge:
 * this module reports candidates with the evidence that points at them; a person decides.
 *
 *   EXACT     the same mailbox (email), or the same website domain AND the same company.
 *   LIKELY    the same website domain; the same phone number; the same company name where city and
 *             postcode do not contradict it; a business email on the client's own domain.
 *   POSSIBLE  the same company name in a different city or postcode ("Bella Italia" exists in every
 *             city); the same person's name with nothing else in common.
 *   NONE      nothing points at an existing client.
 *
 * Free-mail domains (gmail.com, web.de, …) are not business evidence: two strangers share them.
 * Archived clients are matched too and flagged, so Marcel restores the old record instead of
 * creating a second one.
 */
import { normaliseIdentity } from '@/lib/documents/client-match'
import { normaliseDomain, normalisePhone } from '@/lib/commercial/records'
import type { Sql } from '@/lib/commercial/types'

export type MatchLevel = 'exact' | 'likely' | 'possible'

export interface ClientIdentity {
  name?: string | null
  company?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  city?: string | null
  postcode?: string | null
}

export interface MatchableClientRow extends ClientIdentity {
  id: string
  status?: string | null
  archived_at?: string | null
}

export interface ClientCandidate {
  id: string
  label: string
  level: MatchLevel
  /** Machine-readable evidence, e.g. ['email'] or ['company', 'city']. */
  reasons: string[]
  archived: boolean
}

export interface ClientMatchResult {
  level: MatchLevel | 'none'
  candidates: ClientCandidate[]
}

export const FREEMAIL = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.de', 'outlook.com', 'outlook.de', 'hotmail.com', 'hotmail.de',
  'live.com', 'live.de', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'aol.de', 'gmx.de', 'gmx.net',
  'gmx.at', 'gmx.ch', 'web.de', 't-online.de', 'freenet.de', 'posteo.de', 'mailbox.org', 'proton.me',
  'protonmail.com', 'yandex.com', 'mail.de', 'arcor.de', 'vodafone.de', 'online.de', '1und1.de',
])

const RANK: Record<MatchLevel, number> = { exact: 3, likely: 2, possible: 1 }

export function normaliseEmail(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

/** The business domain behind an email address, or '' for free mail and nonsense. */
export function emailDomain(s: string | null | undefined): string {
  const d = normaliseEmail(s).split('@')[1] ?? ''
  return d && !FREEMAIL.has(d) && d.includes('.') ? d : ''
}

function postcodeOf(c: ClientIdentity): string {
  const explicit = (c.postcode ?? '').replace(/\s/g, '')
  if (explicit) return explicit
  /* Older rows kept "45276 Essen" in city. */
  return (c.city ?? '').trim().match(/^(\d{4,5})\b/)?.[1] ?? ''
}

function cityOf(c: ClientIdentity): string {
  return normaliseIdentity((c.city ?? '').replace(/^\s*\d{4,5}\s+/, ''))
}

export function clientDisplayLabel(c: Pick<ClientIdentity, 'name' | 'company'>): string {
  const name = (c.name ?? '').trim()
  const company = (c.company ?? '').trim()
  return company && name && normaliseIdentity(company) !== normaliseIdentity(name) ? `${company} (${name})` : company || name || '—'
}

/** Pure: judge one candidate against the identity. Null when nothing points at it. */
export function judgeCandidate(input: ClientIdentity, row: MatchableClientRow): ClientCandidate | null {
  const reasons: string[] = []
  let level: MatchLevel | null = null
  const raise = (l: MatchLevel) => { if (!level || RANK[l] > RANK[level]) level = l }

  const email = normaliseEmail(input.email)
  const domain = normaliseDomain(input.website)
  const phone = normalisePhone(input.phone)
  const company = normaliseIdentity(input.company)
  const name = normaliseIdentity(input.name)
  const iCity = cityOf(input), iPost = postcodeOf(input)

  const rDomain = normaliseDomain(row.website)
  const rCompany = normaliseIdentity(row.company)
  const sameCompany = Boolean(company) && company === rCompany

  if (email && normaliseEmail(row.email) === email) { reasons.push('email'); raise('exact') }
  if (domain && rDomain && domain === rDomain) {
    reasons.push('website')
    raise(sameCompany ? 'exact' : 'likely')
  }
  if (phone.length >= 6 && normalisePhone(row.phone) === phone) { reasons.push('phone'); raise('likely') }
  const iMailDomain = emailDomain(input.email)
  if (iMailDomain && !reasons.includes('email') && (iMailDomain === emailDomain(row.email) || iMailDomain === rDomain)) {
    reasons.push('email-domain'); raise(rDomain === iMailDomain || sameCompany ? 'likely' : 'possible')
  }
  if (sameCompany) {
    const rCity = cityOf(row), rPost = postcodeOf(row)
    const contradicts = (iPost && rPost && iPost !== rPost) || (iCity && rCity && iCity !== rCity)
    reasons.push('company')
    if (contradicts) raise('possible')
    else { if (iCity && rCity) reasons.push('city'); if (iPost && rPost) reasons.push('postcode'); raise('likely') }
  }
  if (!reasons.length && name && name === normaliseIdentity(row.name)) { reasons.push('name'); raise('possible') }

  if (!level) return null
  return {
    id: row.id,
    label: clientDisplayLabel(row),
    level,
    reasons,
    archived: row.status === 'archived' || Boolean(row.archived_at),
  }
}

/** Pure: every candidate, strongest first; `level` is the strongest found. */
export function matchClients(input: ClientIdentity, rows: readonly MatchableClientRow[], opts: { excludeIds?: readonly string[] } = {}): ClientMatchResult {
  const exclude = new Set(opts.excludeIds ?? [])
  const candidates = rows
    .filter(r => !exclude.has(r.id))
    .map(r => judgeCandidate(input, r))
    .filter((c): c is ClientCandidate => c !== null)
    .sort((a, b) => RANK[b.level] - RANK[a.level] || a.label.localeCompare(b.label))
    .slice(0, 10)
  return { level: candidates[0]?.level ?? 'none', candidates }
}

/** Has the identity anything a match could be based on? */
export function hasMatchableEvidence(i: ClientIdentity): boolean {
  return Boolean(normaliseEmail(i.email) || normaliseDomain(i.website) || normalisePhone(i.phone).length >= 6 || normaliseIdentity(i.company) || normaliseIdentity(i.name))
}

/**
 * Load the clients that could match and judge them. The SQL only narrows (by email, phone digits,
 * website/email domain, or a company/name word); the verdict is always the pure function above.
 */
export async function findClientMatches(sql: Sql, input: ClientIdentity, opts: { excludeIds?: readonly string[] } = {}): Promise<ClientMatchResult> {
  if (!hasMatchableEvidence(input)) return { level: 'none', candidates: [] }
  const email = normaliseEmail(input.email)
  const domain = normaliseDomain(input.website) || emailDomain(input.email)
  const phoneTail = normalisePhone(input.phone).slice(-7)
  const word = [normaliseIdentity(input.company), normaliseIdentity(input.name)]
    .flatMap(s => s.split(' ')).filter(w => w.length >= 3).sort((a, b) => b.length - a.length)[0] ?? ''
  const rows = await sql`
    SELECT id, name, company, email, phone, website, city, postcode, status, archived_at FROM os_clients
    WHERE (${email} <> '' AND lower(email) = ${email})
       OR (${domain} <> '' AND (lower(coalesce(website, '')) LIKE ${'%' + domain + '%'} OR lower(coalesce(email, '')) LIKE ${'%@' + domain}))
       OR (${phoneTail} <> '' AND length(${phoneTail}) >= 6 AND regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') LIKE ${'%' + phoneTail})
       OR (${word} <> '' AND replace(replace(replace(replace(lower(coalesce(company, '') || ' ' || name), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss')
                             LIKE ${'%' + word + '%'})
    LIMIT 200` as MatchableClientRow[]
  return matchClients(input, rows, opts)
}
