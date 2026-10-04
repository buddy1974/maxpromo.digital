/**
 * lib/documents/numbering.ts
 *
 * What number the next saved quotation will receive, worked out the same way
 * the allocator works it out, without asking the allocator.
 *
 * WHAT HAPPENED
 *
 * The 2026-09-26 fix stopped the blank form consuming numbers by replacing the
 * allocator call with a preview "computed from stored rows": the highest
 * ANG-number in `os_angebote`, plus one. It was right that reading must not
 * call `nextval()`. It was wrong about where the next number comes from.
 *
 * Save does not look at the rows. It calls `next_angebot_number()`, which reads
 * the per-year sequence `doc_seq.angebot_<year>`. Rows and sequence agree only
 * if every number the sequence ever issued became a row — and the defect being
 * fixed was precisely numbers issued without rows. In the evidence lab there
 * were no ANG rows at all and the sequence stood at 14, so the form promised
 * ANG-2026-001 three times and the first save produced ANG-2026-015.
 *
 * 015 was the correct number. The preview was the defect.
 *
 * THE RULE
 *
 * The preview reads the same state the allocator advances and predicts the
 * same answer: the sequence's next value if the sequence exists, 1 if the
 * function exists but has not created this year's sequence yet, and the
 * rows-based fallback only when the function itself is missing — which is
 * exactly what `nextAngebotNumber()` falls back to in that case.
 *
 * Reading `pg_sequences` does not advance anything. It is a catalogue view, and
 * `last_value` there is NULL until the first `nextval()`, which is how "created
 * but never used" is told apart from "used once".
 *
 * WHAT IT CANNOT PROMISE
 *
 * A competing save between preview and save takes the previewed number, and
 * this save gets the next one. That is correct: the allocator stays the only
 * authority, `nextval()` is atomic, and the form never sends its preview back.
 *
 * Pure and dependency-free, so the gate that proves it can import it directly.
 */

export interface SequenceState {
  /** NULL in `pg_sequences` until the sequence has issued its first value. */
  lastValue: number | null
  startValue: number
  incrementBy: number
}

export interface NumberingState {
  year: number
  /** `doc_seq.angebot_<year>`, or null if it does not exist yet. */
  sequence: SequenceState | null
  /** Whether `next_angebot_number(integer)` exists in the database. */
  hasAllocator: boolean
  /** Highest numeric suffix among stored ANG-<year>- rows, or null. */
  maxStoredSuffix: number | null
}

export function formatAngebotNumber(year: number, n: number): string {
  return `ANG-${year}-${String(n).padStart(3, '0')}`
}

/** The number `nextAngebotNumber()` would issue right now, given this state. */
export function predictNextAngebotNumber(state: NumberingState): string {
  if (state.hasAllocator) {
    const seq = state.sequence
    /* The function creates a missing sequence with START WITH 1. */
    if (!seq) return formatAngebotNumber(state.year, 1)
    const next = seq.lastValue === null ? seq.startValue : seq.lastValue + seq.incrementBy
    return formatAngebotNumber(state.year, next)
  }
  /* The route's own fallback when the function is missing. */
  return formatAngebotNumber(state.year, (state.maxStoredSuffix ?? 0) + 1)
}

/** The per-year sequence name, as the migration's functions build it. */
export function angebotSequenceName(year: number): string {
  return `angebot_${year}`
}
