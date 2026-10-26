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
import { qualify, type Qualification, type UnknownCode } from './qualify.ts'
import { INJECTION, REJECT_REASONS, SIGNAL_CODES, SOLUTIONS, TOPICS, type Evidence, type Inference, type Opportunity, type Rejection, type ResearchFindings, type SignalFact, type Solution } from './research.ts'
import type { Coverage, PageKind } from './fetchSite.ts'

export type ResearchRecommendation = 'outreach_draft' | 'find_contact' | 'review' | 'not_a_fit'

export interface ResearchWorkResult {
  findings: ResearchFindings
  qualification: Qualification
  recommendation: ResearchRecommendation
}

export function recommendNext(f: ResearchFindings, q: Qualification): ResearchRecommendation {
  if (f.injection_suspected || q.verdict === 'review') return 'review'
  if (q.verdict === 'qualified') return f.contact.email ? 'outreach_draft' : 'find_contact'
  return 'not_a_fit'
}

/**
 * What Marcel should check, in order: what the research could not establish (code), then the open
 * questions the pages raised (model, grounded in what it read). Uncertainty becomes a plan.
 */
export type Check = { code: UnknownCode; value: string } | { question: string }
export function investigationPlan(f: ResearchFindings, q: Qualification, max = 5): Check[] {
  return [...(q.unknowns ?? []), ...(f.unknowns ?? []).map(question => ({ question }))].slice(0, max)
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
  if ((r.version !== 1 && r.version !== 2) || r.state !== 'done') return null
  const origin = httpUrl(r.origin)
  const researchedAt = s(r.researched_at, 40)
  if (!origin || !researchedAt || Number.isNaN(Date.parse(researchedAt))) return null
  const pages = Array.isArray(r.pages) && r.pages.length >= 1 && r.pages.length <= 10
    ? r.pages.map(p => { const o = p as Record<string, unknown>; const url = httpUrl(o?.url); const title = s(o?.title, 300); return url && title !== null ? { url, title } : null })
    : null
  if (!pages || pages.some(p => !p)) return null
  const evidence = Array.isArray(r.evidence) && r.evidence.length <= 12
    ? r.evidence.map(e => {
      const o = e as Record<string, unknown>
      const kind = o?.kind
      const url = httpUrl(o?.url), text = s(o?.text, 300), quote = s(o?.quote, 240)
      if (!((kind === 'pain_point' || kind === 'opportunity' || kind === 'fact') && url && text && quote)) return null
      const id = o.id === undefined ? undefined : s(o.id, 8)
      const topic = o.topic === undefined ? undefined : (TOPICS as readonly string[]).includes(o.topic as string) ? o.topic as Evidence['topic'] : null
      const also = o.also === undefined ? undefined : Array.isArray(o.also) && o.also.length <= 5 ? o.also.map(httpUrl) : null
      if (id === null || topic === null || also === null || also?.some(u => !u)) return null
      return { kind, text, quote, url, ...(id ? { id } : {}), ...(topic ? { topic } : {}), ...(also?.length ? { also: also as string[] } : {}) } as Evidence
    })
    : null
  if (!evidence || evidence.some(e => !e)) return null
  /* Evidence must cite a page that was read: a quote from anywhere else was not verified. */
  const read = new Set(pages.map(p => p!.url))
  if (evidence.some(e => !read.has(e!.url) || e!.also?.some(u => !read.has(u)))) return null
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
  if (g.httpsAvailable !== undefined && g.httpsAvailable !== null && typeof g.httpsAvailable !== 'boolean') return null
  const httpsAvailable = g.httpsAvailable as boolean | null | undefined
  const extra = parseIntelligence(r, evidence as Evidence[])
  if (!extra) return null
  return {
    version: r.version as 1 | 2, state: 'done', researched_at: researchedAt, origin,
    pages: pages as { url: string; title: string }[], skipped, summary,
    business_type: businessType, city, services, evidence: evidence as Evidence[],
    rejected: r.rejected, injection_suspected: r.injection_suspected, angle,
    contact: contact as ResearchFindings['contact'],
    signals: { https: g.https, mobileViewport: g.mobileViewport, generator, bookingTool, contactForm: g.contactForm, emails, phones, newestYear, ...(httpsAvailable !== undefined ? { httpsAvailable } : {}) },
    language: r.language === 'en' ? 'en' : 'de', model,
    ...extra,
  }
}

const KINDS: readonly PageKind[] = ['home', 'contact', 'appointments', 'services', 'about', 'identity']
const num = (x: unknown, max: number) => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= max

/**
 * The ADR-0031 parts, when present. An inference, opportunity or unknown that cites an id no kept
 * fact or signal has, or that addresses a model, is dropped here too: the OS does not take the
 * agent's word for grounding any more than for the score.
 */
function parseIntelligence(r: Record<string, unknown>, evidence: Evidence[]): Partial<ResearchFindings> | null {
  const out: Partial<ResearchFindings> = {}
  if (r.coverage !== undefined) {
    const c = r.coverage as Record<string, unknown> | null
    if (!c || !num(c.pages, 20) || !num(c.frames, 10) || !num(c.chars, 100_000) || typeof c.thin !== 'boolean') return null
    const read = Array.isArray(c.read) && c.read.length <= 6 && c.read.every(k => KINDS.includes(k as PageKind)) ? c.read as PageKind[] : null
    const charsets = strings(c.charsets, 6, 40)
    if (!read || !charsets) return null
    out.coverage = { pages: c.pages as number, frames: c.frames as number, chars: c.chars as number, thin: c.thin, read, charsets } satisfies Coverage
  }
  let signalFacts: SignalFact[] = []
  if (r.signal_facts !== undefined) {
    if (!Array.isArray(r.signal_facts) || r.signal_facts.length > 8) return null
    signalFacts = r.signal_facts.map(x => {
      const o = (x ?? {}) as Record<string, unknown>
      return s(o.id, 8) && (SIGNAL_CODES as readonly string[]).includes(o.code as string) && s(o.value, 200) !== null ? { id: o.id as string, code: o.code as SignalFact['code'], value: o.value as string } : null
    }).filter((x): x is SignalFact => !!x)
    out.signal_facts = signalFacts
  }
  const known = new Set([...evidence.map(e => e.id).filter(Boolean) as string[], ...signalFacts.map(x => x.id)])
  const grounded = (x: unknown) => Array.isArray(x) && x.length >= 1 && x.length <= 6 && x.every(id => typeof id === 'string' && known.has(id))
  const ok = (t: unknown, max: number) => s(t, max) !== null && !INJECTION.test(t as string)
  if (r.inferences !== undefined) {
    if (!Array.isArray(r.inferences) || r.inferences.length > 4) return null
    out.inferences = r.inferences.map(x => x as Record<string, unknown>)
      .filter(o => o && ok(o.text, 300) && grounded(o.based_on))
      .map(o => ({ text: o.text as string, based_on: o.based_on as string[] }) satisfies Inference)
  }
  if (r.opportunities !== undefined) {
    if (!Array.isArray(r.opportunities) || r.opportunities.length > 3) return null
    out.opportunities = r.opportunities.map(x => x as Record<string, unknown>)
      .filter(o => o && (SOLUTIONS as readonly string[]).includes(o.solution as string) && ok(o.hypothesis, 300) && grounded(o.based_on))
      .map(o => ({ solution: o.solution as Solution, hypothesis: o.hypothesis as string, based_on: o.based_on as string[] }) satisfies Opportunity)
  }
  if (r.unknowns !== undefined) {
    if (!Array.isArray(r.unknowns) || r.unknowns.length > 4) return null
    out.unknowns = r.unknowns.filter(u => ok(u, 200)) as string[]
  }
  if (r.rejections !== undefined) {
    if (!Array.isArray(r.rejections) || r.rejections.length > 16) return null
    out.rejections = r.rejections.map(x => x as Record<string, unknown>)
      .filter(o => o && ['fact', 'inference', 'opportunity', 'unknown'].includes(o.kind as string) && (REJECT_REASONS as readonly string[]).includes(o.reason as string))
      .map(o => ({ kind: o.kind, reason: o.reason, ...(httpUrl(o.url) ? { url: httpUrl(o.url)! } : {}), ...(s(o.quote, 140) ? { quote: o.quote } : {}) }) as Rejection)
  }
  if (r.merged !== undefined) {
    if (!num(r.merged, 50)) return null
    out.merged = r.merged as number
  }
  return out
}
