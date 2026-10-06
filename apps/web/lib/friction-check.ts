/**
 * lib/friction-check.ts
 *
 * The Business Friction Check: six questions about things that actually happen
 * in a week, and a result that names the shape of the friction rather than
 * scoring the business.
 *
 * WHAT THIS DELIBERATELY IS NOT
 *
 * There is no score. No percentage, no maturity level, no "readiness". A number
 * attached to six self-reported answers is false precision, and the whole
 * repository already refuses that argument elsewhere — an unsupported quantity
 * may not be used to persuade, and inventing one about the visitor's own
 * business is the same offence pointed the other way.
 *
 * It is also not a lead form wearing a diagnosis. The result is shown in full
 * before anything is asked for. Email is optional and comes afterwards, because
 * a result held hostage is not a useful result.
 *
 * WHAT THE QUESTIONS ASK ABOUT
 *
 * Observable events, not opinions. "When an enquiry arrives, where does it
 * land" has an answer the owner knows. "How digital is your business" does not,
 * and every answer to it is a guess about a word.
 *
 * THE HONEST OUTCOME
 *
 * `none` is a real result and is reachable: answer the low-friction option
 * throughout and the check says so, and says this company is probably not what
 * you need right now. That outcome exists because a diagnostic that always
 * finds a problem is a sales script, and one that can say "you're fine" is
 * worth listening to when it doesn't.
 */

/** The five shapes of operational friction this check can recognise. */
export const FRICTION_PATTERNS = [
  'repeatedWork',
  'disconnected',
  'waiting',
  'documents',
  'followUp',
] as const

export type FrictionPattern = (typeof FRICTION_PATTERNS)[number]

/**
 * How strongly one answer indicates one pattern.
 *
 * Two levels, not five. The difference between "sometimes" and "daily" is real
 * and worth encoding; the difference between a 3 and a 4 on a scale nobody
 * calibrated is not.
 */
type Weight = 1 | 2

export interface FrictionOption {
  /** Stable id, used as the i18n key suffix and in the answer state. */
  readonly id: string
  /** Patterns this answer indicates, with strength. Empty = no friction. */
  readonly indicates: Partial<Record<FrictionPattern, Weight>>
}

export interface FrictionQuestion {
  readonly id: string
  readonly options: readonly FrictionOption[]
}

/**
 * Six questions. Enough to see a shape, few enough to finish.
 *
 * Every question is about a moment that occurs in an ordinary week, and every
 * first option is the low-friction answer so that a business running well can
 * say so without hunting for it.
 */
export const FRICTION_QUESTIONS: readonly FrictionQuestion[] = [
  {
    // Where a new enquiry lands.
    id: 'q1',
    options: [
      { id: 'a', indicates: {} },
      { id: 'b', indicates: { disconnected: 1 } },
      { id: 'c', indicates: { disconnected: 2, followUp: 1 } },
      { id: 'd', indicates: { disconnected: 2, followUp: 2 } },
    ],
  },
  {
    // Preparing a quotation, order confirmation or similar.
    id: 'q2',
    options: [
      { id: 'a', indicates: {} },
      { id: 'b', indicates: { documents: 1, repeatedWork: 1 } },
      { id: 'c', indicates: { documents: 2, repeatedWork: 2 } },
      { id: 'd', indicates: { documents: 1, waiting: 2, disconnected: 1 } },
    ],
  },
  {
    // Getting something approved before it reaches a customer.
    id: 'q3',
    options: [
      { id: 'a', indicates: {} },
      { id: 'b', indicates: { waiting: 2 } },
      { id: 'c', indicates: { waiting: 2, disconnected: 1 } },
      { id: 'd', indicates: { waiting: 1 } },
    ],
  },
  {
    // Following up on something still open.
    id: 'q4',
    options: [
      { id: 'a', indicates: {} },
      { id: 'b', indicates: { followUp: 1 } },
      { id: 'c', indicates: { followUp: 2 } },
      { id: 'd', indicates: { followUp: 2, disconnected: 1 } },
    ],
  },
  {
    // The same information typed into more than one place.
    id: 'q5',
    options: [
      { id: 'a', indicates: {} },
      { id: 'b', indicates: { repeatedWork: 1, disconnected: 1 } },
      { id: 'c', indicates: { repeatedWork: 2, disconnected: 1 } },
      { id: 'd', indicates: { repeatedWork: 2, disconnected: 2 } },
    ],
  },
  {
    // Finding out where a job or an order stands.
    id: 'q6',
    options: [
      { id: 'a', indicates: {} },
      { id: 'b', indicates: { waiting: 1, disconnected: 1 } },
      { id: 'c', indicates: { waiting: 2, disconnected: 2 } },
      { id: 'd', indicates: { waiting: 2, followUp: 1 } },
    ],
  },
]

/** answers[questionId] = optionId */
export type FrictionAnswers = Readonly<Record<string, string>>

/**
 * The four things the check can conclude, in plain words.
 *
 *   nothingUrgent  no pattern is strong enough to name
 *   system         the friction spans tools, people and stages at once
 *   automation     a clear, repeated task stands out
 *   simplify       friction exists, but it is waiting and confusion rather
 *                  than one repeated task — the process comes before technology
 *
 * A category, never a number: it says what kind of answer fits, not how much
 * of a problem the business has.
 */
export const FRICTION_OUTCOMES = ['nothingUrgent', 'simplify', 'automation', 'system'] as const
export type FrictionOutcome = (typeof FRICTION_OUTCOMES)[number]

/** Patterns that describe one repeated task a focused automation can carry. */
const TASK_PATTERNS: readonly FrictionPattern[] = ['repeatedWork', 'documents', 'followUp']

/** How many named patterns, with disconnection among them, make it a system question. */
const SYSTEM_SPREAD = 3

export interface FrictionResult {
  /** The conclusion, decided by `outcomeOf` below. */
  readonly outcome: FrictionOutcome
  /** Patterns worth naming, strongest first. Empty when nothing stood out. */
  readonly patterns: readonly FrictionPattern[]
  /** Raw tallies, so the page can show its working rather than assert it. */
  readonly tally: Readonly<Record<FrictionPattern, number>>
  /** True when the honest answer is "this looks like it is working". */
  readonly lowFriction: boolean
  readonly answered: number
  readonly total: number
}

/**
 * The threshold at which a pattern is worth naming.
 *
 * Three means either one emphatic answer plus a mild one, or two mild ones
 * agreeing. One emphatic answer on its own is not a pattern — it is a bad
 * Tuesday, and naming it would make the check credulous.
 */
const NAME_AT = 3

/** At most this many patterns are named. A result that lists everything says nothing. */
const MAX_PATTERNS = 2

export function scoreFriction(answers: FrictionAnswers): FrictionResult {
  const tally = Object.fromEntries(
    FRICTION_PATTERNS.map((p) => [p, 0]),
  ) as Record<FrictionPattern, number>

  let answered = 0
  for (const q of FRICTION_QUESTIONS) {
    const chosen = answers[q.id]
    if (!chosen) continue
    const option = q.options.find((o) => o.id === chosen)
    if (!option) continue
    answered += 1
    for (const [pattern, weight] of Object.entries(option.indicates)) {
      tally[pattern as FrictionPattern] += weight as number
    }
  }

  /* Every pattern that reaches the threshold, before trimming for display.
     The outcome reads the full set; the page shows at most two. */
  const named = FRICTION_PATTERNS
    .filter((p) => tally[p] >= NAME_AT)
    /* Ties resolve by the declared order of FRICTION_PATTERNS rather than
       arbitrarily, so the same answers always produce the same result. A
       diagnostic that reorders itself between runs is not one. */
    .sort((a, b) => tally[b] - tally[a] || FRICTION_PATTERNS.indexOf(a) - FRICTION_PATTERNS.indexOf(b))
  const patterns = named.slice(0, MAX_PATTERNS)

  return {
    outcome: outcomeOf(named),
    patterns,
    tally,
    lowFriction: patterns.length === 0,
    answered,
    total: FRICTION_QUESTIONS.length,
  }
}

/**
 * The outcome, from the patterns that reached the threshold. Checked in this
 * order, first match wins:
 *
 *   1. nothing named                                   → nothingUrgent
 *   2. `disconnected` named AND ≥ 3 patterns named     → system
 *      Information split across tools is what turns several separate
 *      frictions into one process problem; another automation would move it.
 *   3. any of repeatedWork, documents, followUp named  → automation
 *      One task with a recognisable shape: a focused automation can carry it.
 *   4. otherwise (waiting and/or disconnected only)    → simplify
 *      Friction without a repeated task to automate: fix the process first.
 *
 * Proved for every outcome and at its boundaries by
 * packages/tooling/prove-friction-check.mjs.
 */
export function outcomeOf(named: readonly FrictionPattern[]): FrictionOutcome {
  if (named.length === 0) return 'nothingUrgent'
  if (named.includes('disconnected') && named.length >= SYSTEM_SPREAD) return 'system'
  if (named.some((p) => TASK_PATTERNS.includes(p))) return 'automation'
  return 'simplify'
}
