'use client'
/**
 * components/os/ExtractionReview.tsx
 *
 * The visible half of the AI provenance boundary, shared by every commercial-
 * document screen that offers AI extraction. The rules live in
 * lib/documents/extraction-guard.ts and lib/documents/ai-adoption.ts; this file
 * only shows a person what was removed, what is held and why, and gives them
 * the one deliberate override. One copy, so a hold looks and behaves the same
 * on a new quotation, an edited quotation and a new invoice.
 */
import { Icon } from '@maxpromo/ui'
import { useOsLocale } from '@/lib/os-i18n/context'
import { isHeld } from '@/lib/documents/ai-adoption'
import type { ClientMatch, MatchableClient } from '@/lib/documents/client-match'

const mono = 'var(--brand-font-mono)'
const sans = 'var(--brand-font-body)'

/** What the server removed, held or withheld, in its own words. */
export function ExtractionWarnings({ warnings }: { warnings: string[] }) {
  const { t } = useOsLocale()
  if (warnings.length === 0) return null
  return (
    <div role="alert" style={{ background: 'color-mix(in srgb, var(--semantic-danger) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-danger) 25%, transparent)', padding: '10px 14px', marginBottom: '14px', borderRadius: 'var(--radius-xs)' }}>
      <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-danger)', margin: '0 0 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}><Icon name="warning" size="xs" /> {t.forms.extractionWarningsHeading}</p>
      <ul style={{ margin: 0, paddingLeft: '18px' }}>
        {warnings.map((w, i) => (
          <li key={i} style={{ fontFamily: sans, fontSize: '12px', color: 'var(--semantic-danger)', lineHeight: 1.5, marginBottom: '2px' }}>{w}</li>
        ))}
      </ul>
    </div>
  )
}

/** Why one line is held, and the deliberate way to keep it. Renders nothing for a line that is not held. */
export function HeldLineNotice({ item, onKeep }: {
  item: { description: string; unsupportedTerms?: string[] }
  onKeep: () => void
}) {
  const { t } = useOsLocale()
  if (!isHeld(item)) return null
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
      <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-danger)', letterSpacing: '0.04em' }}><Icon name="warning" size="xs" /> {t.forms.heldTerms((item.unsupportedTerms ?? []).join(', '))}</span>
      <button type="button" onClick={onKeep} style={{ background: 'none', border: '1px solid var(--semantic-danger)', color: 'var(--semantic-danger)', fontFamily: mono, fontSize: 'var(--text-label-dense)', letterSpacing: '0.06em', padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: 'var(--radius-xs)' }}>{t.forms.keepDeliberately}</button>
    </div>
  )
}

/** Shown beside a save control while lines are held. */
export function HeldSaveNotice({ count }: { count: number }) {
  const { t } = useOsLocale()
  if (count === 0) return null
  return <p role="status" style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--semantic-danger)', margin: '10px 0 0', letterSpacing: '0.04em' }}><Icon name="warning" size="xs" /> {t.forms.heldSaveBlocked(count)}</p>
}

/** The outcome of matching an extracted customer against existing clients. */
export function ClientMatchNotice<C extends MatchableClient>({ match }: { match: ClientMatch<C> | null }) {
  const { t } = useOsLocale()
  if (!match || match.kind === 'none') return null
  const text = match.kind === 'linked'
    ? t.forms.clientLinked(match.client.company || match.client.name || '')
    : t.forms.clientAmbiguous(match.candidates.length)
  return <p role="status" style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', margin: 0, letterSpacing: '0.04em' }}>{text}</p>
}
