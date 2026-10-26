/**
 * Qualification (ADR-0027 §2, ADR-0031): an opportunity score with its reasons, a research
 * confidence, and a verdict — computed by code from verified research.
 *
 * The model finds and quotes; it does not score. Every point here comes from a rule Marcel can
 * read in the reasons list, and every rule is fed either by a code-read signal (fetchSite.ts) or
 * by evidence whose quote was found on the page (research.ts). A site cannot talk its way to a
 * high score: an injected "we urgently need automation" has no verified quote and counts nothing.
 *
 * TWO DIMENSIONS, NOT ONE
 *
 *   score       — commercial opportunity: how strongly the verified signals suggest a Maxpromo fit
 *   confidence  — research confidence: how well the reading supports any view at all
 *
 * NO EVIDENCE IS NOT NEGATIVE EVIDENCE
 *
 * A rule that rests on something being absent (no booking tool, no email, no mobile layout, no
 * angle) applies only when the place it would be was actually read (coverage). Otherwise it scores
 * nothing and becomes an unknown — a question for Marcel, not a verdict on the business.
 *
 * THE VERDICT
 *
 *   qualified      score ≥ 50 and confidence medium or high
 *   review         confidence low (or text aimed at a model): we do not know enough to say no
 *   not_qualified  score < 50 and confidence medium or high: we read enough, and it does not fit
 *
 * Low research confidence never reads as "not qualified": "I don't know enough" is not "bad prospect".
 */
import type { ResearchFindings } from './research.ts'

export const QUALIFY_THRESHOLD = 50

export type Confidence = 'high' | 'medium' | 'low'
export type Verdict = 'qualified' | 'review' | 'not_qualified'
/** `code` names the rule (rendered in the screen language); `value` is the evidence it rests on. */
export type ReasonCode = 'fit' | 'pain' | 'opportunity' | 'no_booking' | 'not_mobile' | 'no_https' | 'stale' | 'reachable' | 'no_email' | 'no_angle'
export type CaveatCode = 'no_evidence' | 'rejected' | 'one_page' | 'skipped' | 'injection' | 'thin'
/** What the research could not establish — each one a thing to check, scored as nothing. */
export type UnknownCode = 'content_hidden' | 'booking' | 'mobile' | 'email' | 'email_domain' | 'angle'
export interface Reason { points: number; code: ReasonCode; value: string }
export interface Qualification {
  score: number
  confidence: Confidence
  /** verdict === 'qualified' — kept for the stage rule and older readers. */
  qualified: boolean
  verdict: Verdict
  reasons: Reason[]
  /** Why the confidence is not high. */
  caveats: { code: CaveatCode; value: string }[]
  unknowns: { code: UnknownCode; value: string }[]
}

/** Trades and practices Maxpromo knows: where its service families have proved useful. */
const FIT = /(handwerk|elektr|sanitär|heizung|install|maler|tischler|schreiner|dachdeck|zimmer|bau|kfz|werkstatt|praxis|arzt|zahn|physio|therap|pflege|restaurant|gastro|café|cafe|hotel|immobil|makler|hausverwalt|steuer|kanzlei|druck|verlag|fahrschule|friseur|kosmetik|electric|plumb|clinic|dental|real estate|print)/i
/** Businesses whose customers book appointments: an online booking tool is the expected alternative. */
const BOOKS = /(praxis|arzt|zahn|physio|therap|friseur|kosmetik|restaurant|werkstatt|kfz|fahrschule|clinic|dental)/i

export function qualify(f: ResearchFindings, year = new Date().getFullYear()): Qualification {
  const reasons: Reason[] = []
  const unknowns: Qualification['unknowns'] = []
  const add = (points: number, code: ReasonCode, value = '') => reasons.push({ points, code, value })
  const unknown = (code: UnknownCode, value = '') => unknowns.push({ code, value })

  /* What was actually read. Research recorded before coverage existed is read as it always was. */
  const cov = f.coverage
  const thin = cov?.thin ?? false
  const sawContactPlace = !cov || cov.read.includes('contact') || cov.read.includes('identity') || f.signals.emails.length > 0
  const sawBookingPlace = !cov || (!thin && (cov.read.includes('appointments') || cov.read.includes('contact')))

  /* One signal, one reason: pain points count once per topic, however many pages repeat them. */
  const pains = f.evidence.filter(e => e.kind === 'pain_point')
    .filter((e, i, all) => !e.topic || e.topic === 'other' || all.findIndex(o => o.topic === e.topic) === i)
  const opps = f.opportunities
    ? f.opportunities.map(o => o.hypothesis)
    : f.evidence.filter(e => e.kind === 'opportunity').map(e => e.text)

  if (f.business_type && FIT.test(`${f.business_type} ${f.summary}`)) add(15, 'fit', f.business_type)
  pains.slice(0, 3).forEach(p => add(12, 'pain', p.text))
  opps.slice(0, 2).forEach(o => add(6, 'opportunity', o))
  if (!f.signals.bookingTool && FIT.test(f.business_type ?? '') && BOOKS.test(`${f.business_type} ${f.summary}`)) {
    if (sawBookingPlace) add(10, 'no_booking')
    else unknown('booking')
  }
  if (!f.signals.mobileViewport) {
    if (thin) unknown('mobile')
    else add(8, 'not_mobile')
  }
  /* HTTPS that does not answer at all; research before the check existed knew only the landing page. */
  if (f.signals.httpsAvailable === false || (f.signals.httpsAvailable === undefined && !f.signals.https)) add(5, 'no_https')
  if (f.signals.newestYear && f.signals.newestYear <= year - 3) add(5, 'stale', String(f.signals.newestYear))
  if (f.contact.email) add(10, 'reachable', f.contact.email)
  /* An address the site publishes on another domain is not "no address": it is one to check. */
  else if (f.contact.email_off_domain) unknown('email_domain', f.contact.email_off_domain)
  else if (sawContactPlace && !thin) add(-10, 'no_email')
  else unknown('email')
  if (!f.angle) {
    if (thin || f.evidence.length === 0) unknown('angle')
    else add(-10, 'no_angle')
  }
  if (thin) unknown('content_hidden')

  const caveats: Qualification['caveats'] = []
  const contentPages = cov ? cov.pages - Math.max(0, cov.frames - 1) : f.pages.length
  if (thin) caveats.push({ code: 'thin', value: String(cov?.chars ?? 0) })
  if (f.evidence.length === 0) caveats.push({ code: 'no_evidence', value: '' })
  if (f.rejected > f.evidence.length) caveats.push({ code: 'rejected', value: String(f.rejected) })
  if (contentPages < 2) caveats.push({ code: 'one_page', value: '' })
  if (f.skipped.length) caveats.push({ code: 'skipped', value: f.skipped.slice(0, 3).join(', ') })
  if (f.injection_suspected) caveats.push({ code: 'injection', value: '' })
  const confidence: Confidence = f.injection_suspected || thin || f.evidence.length === 0 || caveats.length >= 3 ? 'low' : caveats.length ? 'medium' : 'high'

  const score = Math.max(0, Math.min(100, reasons.reduce((n, r) => n + r.points, 0)))
  const verdict: Verdict = f.injection_suspected || confidence === 'low' ? 'review' : score >= QUALIFY_THRESHOLD ? 'qualified' : 'not_qualified'
  return { score, confidence, qualified: verdict === 'qualified', verdict, reasons, caveats, unknowns }
}
