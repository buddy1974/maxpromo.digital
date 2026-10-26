/**
 * Research Agent field calibration copy, German and English. English is typed against German.
 * Kept out of LEADS_COPY so the lead list does not carry it: JUDGEMENT_COPY is the one question under a
 * result on the lead screen; CALIBRATION_COPY is the summary page (/os/leads/calibration).
 */
const judgeDe = {
  ask: 'War diese Recherche brauchbar?',
  verdict: { agree: 'Stimmt', partly: 'Teilweise', disagree: 'Stimmt nicht' } as Record<string, string>,
  what: 'Was war falsch? (optional)',
  issue: {
    missed_signal: 'Wichtiges Signal übersehen', overstated: 'Etwas erfunden oder übertrieben', misunderstood: 'Unternehmen falsch verstanden',
    score_too_high: 'Bewertung zu hoch', score_too_low: 'Bewertung zu niedrig', wrong_next_step: 'Falscher nächster Schritt',
  } as Record<string, string>,
  note: 'Warum? (optional, kurz)', save: 'Speichern', change: 'Ändern',
  current: (v: string, d: string) => `Deine Einschätzung: ${v} (${d})`,
  revisions: (n: number) => `${n}× bewertet — frühere Einschätzungen bleiben erhalten`,
  unchanged: 'Ändert nichts an der Recherche, der Bewertung oder dem Lead.',
}
const judgeEn: typeof judgeDe = {
  ask: 'Was this research useful?',
  verdict: { agree: 'Agree', partly: 'Partly', disagree: 'Disagree' } as Record<string, string>,
  what: 'What was wrong? (optional)',
  issue: {
    missed_signal: 'Missed an important signal', overstated: 'Invented or overstated something', misunderstood: 'Misunderstood the business',
    score_too_high: 'Scored too high', score_too_low: 'Scored too low', wrong_next_step: 'Wrong next step',
  } as Record<string, string>,
  note: 'Why? (optional, short)', save: 'Save', change: 'Change',
  current: (v: string, d: string) => `Your judgement: ${v} (${d})`,
  revisions: (n: number) => `judged ${n} times — earlier judgements are kept`,
  unchanged: 'Changes nothing in the research, the score or the lead.',
}
export const JUDGEMENT_COPY: Record<'de' | 'en', typeof judgeDe> = { de: judgeDe, en: judgeEn }

const pageDe = {
  title: 'Kalibrierung des Research Agents',
  intro: 'Echte Interessenten, recherchiert vom Research Agent, verglichen mit deiner Einschätzung. Testdaten werden gezeigt, aber nicht gezählt. Nichts hier verändert den Agenten.',
  researched: 'Recherchiert', reviewed: 'Von dir bewertet', agreement: 'Zustimmung', failed: 'Fehlgeschlagen', partial: 'Nur teilweise lesbar', duration: 'Ø Dauer',
  verdicts: 'Urteile des Agenten', confidence: 'Recherche-Sicherheit', issues: 'Was falsch war', notes: 'Deine Begründungen',
  patterns: 'Zustimmung nach Merkmal', patternBy: { verdict: 'Urteil', confidence: 'Sicherheit', category: 'Branche', reading: 'Lesbarkeit' } as Record<string, string>,
  reading: { full: 'gelesen', partial: 'teilweise' } as Record<string, string>,
  tooFew: (n: number, min: number) => `${n} von mindestens ${min} bewerteten echten Interessenten — noch keine Muster.`,
  none: 'Noch keine Research-Agent-Ergebnisse.',
  runs: 'Alle Recherchen', test: 'Test — nicht gezählt', notReviewed: 'Noch nicht bewertet', failedRun: (d: string) => `Fehlgeschlagen: ${d}`,
  pages: (n: number) => `${n} Seiten`, facts: (n: number) => `${n} Belege`,
  record: 'Ergebnis, wie entschieden', noRecord: 'Vor der Kalibrierung abgeschlossen — Details stehen am Lead (sofern nicht neu recherchiert).',
  limitations: 'Einschränkungen', unknowns: 'Offen', opportunities: 'Chancen', recommendation: 'Empfehlung',
  seconds: (s: number) => `${s} s`, openLead: 'Lead ›',
}
const pageEn: typeof pageDe = {
  title: 'Research Agent calibration',
  intro: 'Real prospects researched by the Research Agent, compared with your judgement. Test data is shown but not counted. Nothing here changes the agent.',
  researched: 'Researched', reviewed: 'Judged by you', agreement: 'Agreement', failed: 'Failed', partial: 'Read only in part', duration: 'Avg. duration',
  verdicts: 'Agent verdicts', confidence: 'Research confidence', issues: 'What was wrong', notes: 'Your reasons',
  patterns: 'Agreement by trait', patternBy: { verdict: 'Verdict', confidence: 'Confidence', category: 'Business type', reading: 'Readability' } as Record<string, string>,
  reading: { full: 'read', partial: 'in part' } as Record<string, string>,
  tooFew: (n: number, min: number) => `${n} of at least ${min} judged real prospects — no patterns yet.`,
  none: 'No Research Agent results yet.',
  runs: 'All research runs', test: 'Test — not counted', notReviewed: 'Not judged yet', failedRun: (d: string) => `Failed: ${d}`,
  pages: (n: number) => `${n} pages`, facts: (n: number) => `${n} facts`,
  record: 'Result as decided', noRecord: 'Finished before calibration — details are on the lead (unless researched again).',
  limitations: 'Limitations', unknowns: 'Open', opportunities: 'Opportunities', recommendation: 'Recommendation',
  seconds: (s: number) => `${s} s`, openLead: 'Lead ›',
}
export const CALIBRATION_COPY: Record<'de' | 'en', typeof pageDe> = { de: pageDe, en: pageEn }
