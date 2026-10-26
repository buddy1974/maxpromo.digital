/**
 * The Max card's view of delegated agent work (ADR-0030, ADR-0031). Types only: the client card and
 * the server (lib/max/max.ts, which builds it) share this one definition without the client
 * importing server code.
 */
/** What the card shows of delegated work: words in the screen language, made here from the record. */
export interface MaxWorkView {
  id: string
  state: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  stateLabel: string
  open: boolean
  lead: { label: string; href: string }
  outcome?: { score: string; confidence: string; qualified: boolean; qualifiedLabel: string }
  evidence: { kind: string; text: string; quote: string; url: string }[]
  evidenceLabel: string
  /** ADR-0031: interpretations and hypotheses, each under its own heading — never under the evidence. */
  reading?: { label: string; note: string; items: string[] }
  opportunities?: { label: string; note: string; items: string[] }
  checks?: { label: string; items: string[] }
  recommendation?: { code: string; text: string }
  warning?: string
  failure?: { text: string; retryable: boolean }
  /** A separate governed next step Marcel may ask for — never started by the result itself. */
  offer?: { label: string; done: boolean }
  footnote: string
}
