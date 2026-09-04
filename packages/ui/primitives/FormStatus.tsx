import type { ReactNode } from 'react'

/**
 * primitives/FormStatus.tsx
 *
 * The one place a form says what just happened.
 *
 * WCAG 2.2 AA, 4.1.3 Status Messages. Every form in this platform showed its
 * errors and its successes visually and announced none of them; a screen
 * reader user submitting the contact form, or failing a login, got silence.
 *
 * The subtle part is *when* the region exists. The obvious implementation is
 *
 *   {error && <p role="alert">{error}</p>}
 *
 * which inserts the live region and its content in the same paint. Assistive
 * technology has to notice a new node and read it in one step, and the results
 * are inconsistent — VoiceOver in particular frequently misses it. So this
 * component renders the region unconditionally and empty, and changes only its
 * *contents*. That is the pattern with reliable support, and it is the reason
 * this is a component rather than an attribute the call sites remember to add.
 *
 * The empty region is `hidden`-free and zero-height by virtue of having no
 * children — `display: none` would remove it from the accessibility tree and
 * undo the whole point.
 */

export type FormStatusTone = 'critical' | 'positive' | 'info'

const ROLE: Record<FormStatusTone, 'alert' | 'status'> = {
  // Errors interrupt: the user cannot proceed and needs to know now.
  critical: 'alert',
  // Success and progress are polite: announced at the next natural pause.
  positive: 'status',
  info: 'status',
}

const CLASS: Record<FormStatusTone, string> = {
  critical: 'status-error',
  positive: 'status-success',
  info: 'status-info',
}

interface FormStatusProps {
  /** The message, or null/undefined when there is nothing to say. */
  children?: ReactNode
  /** Severity. Drives both the visual treatment and the announcement urgency. */
  tone?: FormStatusTone
  /** Extra classes for layout at the call site. Never for colour. */
  className?: string
}

export function FormStatus({ children, tone = 'critical', className }: FormStatusProps) {
  const has = children !== null && children !== undefined && children !== false && children !== ''

  return (
    <div
      role={ROLE[tone]}
      aria-live={tone === 'critical' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={[has ? CLASS[tone] : undefined, className].filter(Boolean).join(' ')}
    >
      {has ? children : null}
    </div>
  )
}
