/**
 * The Research Agent's result contract (ADR-0030).
 *
 * The Bureau's Research Agent returns its findings; the OS does not take its word for the score.
 * `parseFindings` checks the shape and bounds of what arrives (an authenticated agent can still be
 * wrong or broken), and the OS recomputes the qualification with the same `qualify` the agent used.
 * One rule set, applied where the business record lives.
 *
 * The recommendation is code, not the model: it reads the deterministic qualification. It is a
 * suggestion Marcel sees — never an action. An outreach draft is a separate governed proposal.
 */
import { qualify, type Qualification } from './qualify.ts'
import { SOLUTIONS, type Evidence, type ResearchFindings, type Solution } from './research.ts'

export type ResearchRecommendation = 'outreach_draft' | 'find_contact' | 'review' | 'not_a_fit'

export interface ResearchWorkResult {
  findings: ResearchFindings
  qualification: Qualification
  recommendation: ResearchRecommendation
}

export function recommendNext(f: ResearchFindings, q: Qualification): ResearchRecommendation {
  if (f.injection_suspected || q.confidence === 'low') return 'review'
  if (q.qualified) return f.contact.email ? 'outreach_draft' : 'find_contact'
  return 'not_a_fit'
}

export function researchWorkResult(findings: ResearchFindings): ResearchWorkResult {
  const qualification = qualify(findings)
  return { findings, qualification, recommendation: recommendNext(findings, qualification) }
}

const s = (x: unknown, max: number): string | null => (typeof x === 'string' && x.length <= max ? x : null)
const sn = (x: unknown, max: number): string | null | undefined => (x === null ? null : typeof x === 'string' && x.length <= max ? x : undefined)
const httpUrl = (x: unknown): string | null => {
  const v = s(x, 600)
  if (!v) return null
  try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null } catch { return null }
}
const strings = (x: unknown, max: number, each: number): string[] | null =>
  Array.isArray(x) && x.length <= max && x.every(i => typeof i === 'string' && i.length <= each) ? x as string[] : null

/** Findings as they must look, or null. Nothing outside these bounds is stored. */
export function parseFindings(raw: unknown): ResearchFindings | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.version !== 1 || r.state !== 'done') return null
  const origin = httpUrl(r.origin)
  const researchedAt = s(r.researched_at, 40)
  if (!origin || !researchedAt || Number.isNaN(Date.parse(researchedAt))) return null
  const pages = Array.isArray(r.pages) && r.pages.length >= 1 && r.pages.length <= 6
    ? r.pages.map(p => { const o = p as Record<string, unknown>; const url = httpUrl(o?.url); const title = s(o?.title, 300); return url && title !== null ? { url, title } : null })
    : null
  if (!pages || pages.some(p => !p)) return null
  const evidence = Array.isArray(r.evidence) && r.evidence.length <= 12
    ? r.evidence.map(e => {
      const o = e as Record<string, unknown>
      const kind = o?.kind
      const url = httpUrl(o?.url), text = s(o?.text, 300), quote = s(o?.quote, 240)
      return (kind === 'pain_point' || kind === 'opportunity' || kind === 'fact') && url && text && quote ? { kind, text, quote, url } as Evidence : null
    })
    : null
  if (!evidence || evidence.some(e => !e)) return null
  /* Evidence must cite a page that was read: a quote from anywhere else was not verified. */
  const read = new Set(pages.map(p => p!.url))
  if (evidence.some(e => !read.has(e!.url))) return null
  const c = (r.contact ?? {}) as Record<string, unknown>
  const g = (r.signals ?? {}) as Record<string, unknown>
  const angle = r.angle === null ? null : (() => {
    const a = r.angle as Record<string, unknown> | undefined
    return a && (SOLUTIONS as readonly string[]).includes(a.solution as string) && s(a.why, 300) !== null ? { solution: a.solution as Solution, why: a.why as string } : undefined
  })()
  if (angle === undefined) return null
  const services = strings(r.services, 8, 80), skipped = strings(r.skipped, 20, 200)
  const summary = s(r.summary, 400), model = s(r.model, 80)
  const businessType = sn(r.business_type, 80), city = sn(r.city, 80)
  const contact = { email: sn(c.email, 200), phone: sn(c.phone, 40), person: sn(c.person, 80), role: sn(c.role, 80), email_off_domain: sn(c.email_off_domain, 200) }
  const emails = strings(g.emails, 5, 200), phones = strings(g.phones, 5, 40)
  if (!services || !skipped || summary === null || model === null || businessType === undefined || city === undefined || !emails || !phones) return null
  if (Object.values(contact).some(v => v === undefined)) return null
  if (typeof r.rejected !== 'number' || r.rejected < 0 || r.rejected > 100 || typeof r.injection_suspected !== 'boolean') return null
  if (typeof g.https !== 'boolean' || typeof g.mobileViewport !== 'boolean' || typeof g.contactForm !== 'boolean') return null
  const newestYear = g.newestYear === null ? null : typeof g.newestYear === 'number' && g.newestYear > 1995 && g.newestYear < 2100 ? g.newestYear : undefined
  const generator = sn(g.generator, 60), bookingTool = sn(g.bookingTool, 60)
  if (newestYear === undefined || generator === undefined || bookingTool === undefined) return null
  return {
    version: 1, state: 'done', researched_at: researchedAt, origin,
    pages: pages as { url: string; title: string }[], skipped, summary,
    business_type: businessType, city, services, evidence: evidence as Evidence[],
    rejected: r.rejected, injection_suspected: r.injection_suspected, angle,
    contact: contact as ResearchFindings['contact'],
    signals: { https: g.https, mobileViewport: g.mobileViewport, generator, bookingTool, contactForm: g.contactForm, emails, phones, newestYear },
    language: r.language === 'en' ? 'en' : 'de', model,
  }
}
