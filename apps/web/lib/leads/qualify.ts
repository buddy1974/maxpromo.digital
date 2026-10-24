/**
 * Qualification (ADR-0027 §2): a score with its reasons, computed by code from verified research.
 *
 * The model finds and quotes; it does not score. Every point here comes from a rule Marcel can
 * read in the reasons list, and every rule is fed either by a code-read signal (fetchSite.ts) or
 * by evidence whose quote was found on the page (research.ts). A site cannot talk its way to a
 * high score: an injected "we urgently need automation" has no verified quote and counts nothing.
 */
import type { ResearchFindings } from './research'

export const QUALIFY_THRESHOLD = 50

export type Confidence = 'high' | 'medium' | 'low'
/** `code` names the rule (rendered in the screen language); `value` is the evidence it rests on. */
export type ReasonCode = 'fit' | 'pain' | 'opportunity' | 'no_booking' | 'not_mobile' | 'no_https' | 'stale' | 'reachable' | 'no_email' | 'no_angle'
export type CaveatCode = 'no_evidence' | 'rejected' | 'one_page' | 'skipped' | 'injection'
export interface Reason { points: number; code: ReasonCode; value: string }
export interface Qualification {
  score: number
  confidence: Confidence
  qualified: boolean
  reasons: Reason[]
  /** Why the confidence is not high. */
  caveats: { code: CaveatCode; value: string }[]
}

/** Trades and practices Maxpromo knows: where its service families have proved useful. */
const FIT = /(handwerk|elektr|sanitär|heizung|install|maler|tischler|schreiner|dachdeck|zimmer|bau|kfz|werkstatt|praxis|arzt|zahn|physio|therap|pflege|restaurant|gastro|café|cafe|hotel|immobil|makler|hausverwalt|steuer|kanzlei|druck|verlag|fahrschule|friseur|kosmetik|electric|plumb|clinic|dental|real estate|print)/i

export function qualify(f: ResearchFindings, year = new Date().getFullYear()): Qualification {
  const reasons: Reason[] = []
  const add = (points: number, code: ReasonCode, value = '') => reasons.push({ points, code, value })
  const pains = f.evidence.filter(e => e.kind === 'pain_point')
  const opps = f.evidence.filter(e => e.kind === 'opportunity')
  const textLength = f.pages.length

  if (f.business_type && FIT.test(`${f.business_type} ${f.summary}`)) add(15, 'fit', f.business_type)
  pains.slice(0, 3).forEach(p => add(12, 'pain', p.text))
  opps.slice(0, 2).forEach(o => add(6, 'opportunity', o.text))
  if (!f.signals.bookingTool && FIT.test(f.business_type ?? '') && /(praxis|arzt|zahn|physio|therap|friseur|kosmetik|restaurant|werkstatt|kfz|fahrschule|clinic|dental)/i.test(`${f.business_type} ${f.summary}`)) {
    add(10, 'no_booking')
  }
  if (!f.signals.mobileViewport) add(8, 'not_mobile')
  if (!f.signals.https) add(5, 'no_https')
  if (f.signals.newestYear && f.signals.newestYear <= year - 3) add(5, 'stale', String(f.signals.newestYear))
  if (f.contact.email) add(10, 'reachable', f.contact.email)
  else add(-10, 'no_email')
  if (!f.angle) add(-10, 'no_angle')

  const caveats: Qualification['caveats'] = []
  if (f.evidence.length === 0) caveats.push({ code: 'no_evidence', value: '' })
  if (f.rejected > f.evidence.length) caveats.push({ code: 'rejected', value: String(f.rejected) })
  if (textLength < 2) caveats.push({ code: 'one_page', value: '' })
  if (f.skipped.length) caveats.push({ code: 'skipped', value: f.skipped.slice(0, 3).join(', ') })
  if (f.injection_suspected) caveats.push({ code: 'injection', value: '' })
  const confidence: Confidence = f.injection_suspected || f.evidence.length === 0 || caveats.length >= 3 ? 'low' : caveats.length ? 'medium' : 'high'

  const score = Math.max(0, Math.min(100, reasons.reduce((n, r) => n + r.points, 0)))
  return { score, confidence, qualified: score >= QUALIFY_THRESHOLD && confidence !== 'low', reasons, caveats }
}
