/**
 * i18n/client-namespaces.ts
 *
 * Which message namespaces are allowed to reach the browser.
 *
 * THE DEFECT THIS CLOSES (risk 55)
 *
 * `<NextIntlClientProvider>` with no `messages` prop serialises the entire
 * message tree into every page. Measured: 22 namespaces, 66,635 bytes per
 * locale, shipped on every route regardless of what the route renders.
 *
 * That is not only weight. `caseStudies` was among them, so
 * `/de/friction-check` — a page with no commercial figures on it — served
 * `cs2Headline` carrying "14.000 £/Monat an Betriebskosten". ADR-0007 records
 * that figure as CONTRADICTED: published simultaneously as €14k/mo and
 * £14,000/month, seventeen per cent apart, and resolved by deleting it from
 * the pages. It was deleted from what pages *render* and never from what they
 * *serve*.
 *
 * `check:claims` did not catch it because it scans rendering. This list, and
 * the gate that enforces it, is the part that scans delivery.
 *
 * WHY A LIST AND NOT A DERIVATION
 *
 * It could be computed by parsing every client component's `useTranslations`
 * call, and that is exactly what `prove:payload-claims` does — but as a
 * *check* against this list, not as the source of it. A derived allowlist
 * grows silently: add `useTranslations('caseStudies')` to a client component
 * and the derivation quietly starts shipping the claims again. A written list
 * means that same edit fails a gate and someone has to decide.
 *
 * ADDING TO THIS LIST IS A DECISION, WHICH IS THE POINT
 *
 * Before adding a namespace, ask whether the component needs to be a client
 * component at all. Most of this site's text is rendered on the server by
 * `getTranslations`, which reads the full tree server-side and serialises
 * none of it. That is the cheaper and safer default.
 */

/**
 * Namespaces used by `useTranslations` inside a `'use client'` component.
 *
 * Kept in sync by `prove:payload-claims`, which fails if a client component
 * reads a namespace that is not here, and warns if a namespace here is read by
 * no client component.
 */
export const CLIENT_NAMESPACES = [
  'capabilities',   // contact page: the capability preselect
  'contact',        // the contact form itself
  'scenes',         // shared scene copy used by the contact page
  'cookieBanner',   // consent, necessarily client-side
  'frictionCheck',  // the Friction Check is interactive end to end
  'max',            // the assistant panel, bubble and composer
  'nav',            // navigation and the locale switcher
  'voice',          // the voice input widget
] as const

export type ClientNamespace = (typeof CLIENT_NAMESPACES)[number]

/**
 * Namespaces that must never reach the browser, named rather than merely
 * omitted.
 *
 * Omission is silent; a refusal is not. These hold the historical commercial
 * claims the registry marks unresolved or contradicted, and they are rendered
 * by server components on the pages that legitimately carry them. If one of
 * these ever needs to be interactive, that is a conversation and not a commit.
 */
export const NEVER_CLIENT_NAMESPACES = ['caseStudies', 'work', 'blog'] as const

/**
 * Narrow a full message tree to what the browser is allowed to receive.
 *
 * Unknown namespaces are skipped rather than throwing: a namespace listed here
 * but missing from a locale file is a translation problem, and `check:i18n`
 * is the gate that owns it. This function's job is the boundary.
 */
export function pickClientMessages(
  messages: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const ns of CLIENT_NAMESPACES) {
    if (ns in messages) out[ns] = messages[ns]
  }
  return out
}
