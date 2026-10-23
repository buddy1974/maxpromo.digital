/** Deterministic, structural mail risk signals (ADR-0022). No model, network or sender list.
 * The provider's spam folder is the primary signal (providerState.ts); these cover what a
 * provider misses and the time before its state is known. They never delete anything:
 * "suspect" quarantines only a sender with no CRM relationship, decided in SQL.
 */
export type RiskSignal = 'active_attachment' | 'double_extension' | 'automated_sender'

/** Files that execute or render active content when opened. An invoice never needs one. */
const ACTIVE = /\.(html?|shtml|xhtml|svg|js|mjs|vbs|vbe|wsf|hta|cmd|bat|ps1|scr|exe|msi|lnk|iso|img|vhdx?|jar)$/i
const DOCUMENT = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|jpe?g|png|zip)\.[a-z0-9]{2,5}$/i
/** Mailbox names that state no human reads replies. */
const AUTOMATED = /^(no-?reply|do-?not-?reply|donotreply|mailer-daemon|postmaster|bounces?|notifications?)([+._-].*)?@/i

export interface RiskInput { sender: string; attachments: { filename: string }[] }
export interface RiskAssessment { signals: RiskSignal[]; suspect: boolean; replyable: boolean }

export function assessMailRisk(mail: RiskInput): RiskAssessment {
  const signals = new Set<RiskSignal>()
  for (const { filename } of mail.attachments) {
    const name = filename.trim()
    if (ACTIVE.test(name)) signals.add('active_attachment')
    if (DOCUMENT.test(name) && !/\.(pdf|docx?|xlsx?|pptx?|txt|csv|jpe?g|png|zip)$/i.test(name)) signals.add('double_extension')
  }
  if (AUTOMATED.test(mail.sender)) signals.add('automated_sender')
  return {
    signals: [...signals].sort(),
    suspect: signals.has('active_attachment') || signals.has('double_extension'),
    replyable: !signals.has('automated_sender'),
  }
}
