import type { CSSProperties } from 'react'

/**
 * components/landing/showcaseTokens.ts
 *
 * HandwerkOS V2 Showcase Baseline — established 2026-07-25 (Marcel's
 * visual-polish pass). Every section component on an external showcase
 * domain (superhandwerk.de, restaurant-os.de, etc.) should import its
 * spacing/radius/typography/button values from here instead of inlining
 * its own copy. Before this file existed, the eyebrow style alone was
 * duplicated, byte-for-byte, in 14 different section components, and
 * section padding/card radius varied between files with no documented
 * reason — this file is what those values now derive from, and where
 * a future rhythm change happens once instead of 14 times.
 *
 * v4.0 update: VG-01, VG-02 and VG-03 are retired. The CTA colour is no
 * longer "locked to #F97316 and intentionally NOT a CSS variable" — a locked
 * hex that must render identically on every product is precisely the mechanism
 * that would have re-applied the retired orange after the brand migration.
 * Buttons now take --brand-primary like every other surface.
 *
 * Surface custom properties are --showcase-* (set by LandingThemeProvider);
 * the --brand-* namespace belongs to the platform token layer.
 *
 * The heading scale that used to live here has moved to the platform type
 * scale in @maxpromo/design-tokens/brand.css — showcase headings are the same
 * headings. That sentence was written before the constant was actually gone:
 * HEADING_SIZE survived it by a release with five entries, two of which had no
 * consumers and one of which was the 4rem display size the design system
 * retired by name ("64px headings are landing-page size"). Removed in v10.0.
 */

// ── Spacing scale ────────────────────────────────────────────────────
// Named by role, not by raw rem value. A section's padding should say
// what kind of section it is, not just "how much space."
export const SECTION_PADDING = {
  /** Default — most content sections (Audience, Outcome*, Workflow, Features, Visual, Gallery, Trust, Onboarding). */
  base: '4rem 2rem',
  /** Slightly more air — narrative two-column or list-heavy sections (Problem/Solution, Before/After, FAQ). */
  relaxed: '5rem 2rem',
  /** Tighter — compact single-line strips (Outcome stats). *Kept distinct from `base` deliberately — a stat strip reads as an interruption, not a chapter.* */
  tight: '2.5rem 2rem',
  /** Maximum — the final CTA. Deliberately the most spacious section on the page; it should feel like arriving somewhere, not just another block. */
  cta: '7rem 2rem',
  /** Minimum — footer. */
  minimal: '2.5rem 2rem',
} as const

/** Shared max-width for standard content sections. Narrower variants are set per-section where the content is intentionally narrower (hero copy column, FAQ, Conversion). */
export const CONTENT_MAX_WIDTH = '80rem'

export const SECTION_DIVIDER = '1px solid var(--brand-border)'

/** Standard hairline border for cards (feature/trust/onboarding/use-case grids). */
export const CARD_BORDER = '1px solid var(--brand-border)'

// ── Radius scale ─────────────────────────────────────────────────────
export const RADIUS = {
  /** Compact controls — nav CTA button, locale switcher. */
  sm: '8px',
  /** Buttons, screenshot slots. */
  md: '10px',
  /** Grid containers, feature/trust/onboarding cards. */
  lg: '12px',
  /** Large visual elements — hero product image. */
  xl: '16px',
} as const

// ── Typography scale ────────────────────────────────────────────────
/** Section label. Sans, secondary grey — never mono, never accent-coloured. */
export const EYEBROW_STYLE: CSSProperties = {
  fontFamily: 'var(--brand-font-sans)',
  fontSize: 'var(--text-micro)',
  fontWeight: 500,
  color: 'var(--showcase-muted)',
  letterSpacing: 'var(--tracking-label)',
  textTransform: 'uppercase',
}


// ── Buttons ──────────────────────────────────────────────────────────
export const BUTTON_PRIMARY: CSSProperties = {
  fontFamily: 'var(--brand-font-sans)',
  fontWeight: 600,
  fontSize: 'var(--text-small)',
  color: 'var(--brand-on-primary)',
  background: 'var(--brand-primary)',
  padding: '13px 24px',
  borderRadius: RADIUS.md,
  textDecoration: 'none',
  display: 'inline-block',
}

/** Compact variant for the sticky nav, where the full-size primary button would crowd the header. */
export const BUTTON_PRIMARY_COMPACT: CSSProperties = {
  ...BUTTON_PRIMARY,
  fontSize: '12px',
  padding: '9px 16px',
  borderRadius: RADIUS.sm,
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap',
}

export const BUTTON_SECONDARY: CSSProperties = {
  fontFamily: 'var(--brand-font-sans)',
  fontSize: 'var(--text-small)',
  fontWeight: 600,
  color: 'var(--showcase-fg)',
  padding: '13px 24px',
  borderRadius: RADIUS.md,
  border: '1px solid var(--brand-border-strong)',
  textDecoration: 'none',
  display: 'inline-block',
}

// ── Micro-UX: hover / active / focus-visible ───────────────────────────
// Tailwind utility strings, applied via className alongside the inline
// style objects above. Kept as plain classes (not CSS-in-JS or onMouseEnter
// handlers) so server components can use them without becoming client
// components — hover/focus-visible are pure CSS. Deliberately theme-
// agnostic (no hardcoded white/black) because the page runs on both dark
// (#080808, most products) and light (#F5F4F0, PraxisOS) backgrounds via
// LandingThemeProvider — a hardcoded white/10 hover would be invisible on
// the light variant.
export const INTERACTIVE_PRIMARY_CLASSES =
  'transition duration-150 ease-out hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current'

export const INTERACTIVE_SECONDARY_CLASSES =
  'transition-opacity duration-150 ease-out hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current'

export const INTERACTIVE_LINK_CLASSES =
  'transition-opacity duration-150 ease-out hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current focus-visible:rounded-sm'

// ── External link handling ──────────────────────────────────────────
// Added 2026-07-25 (RestaurantOS V2 migration) — RestaurantOS's primary
// CTA points at its own hosted demo (https://demo.restaurant-os.de), an
// absolute URL outside the current product domain. HandwerkOS's CTAs are
// all relative (/contact?system=...), so this need never came up until
// now. Deliberately general-purpose (URL-shape-based, not product-
// specific): any showcase product whose CTA points off-domain — a public
// demo subdomain, a partner tool, a link back to maxpromo.digital — needs
// the same treatment, so this lives in the shared token file rather than
// as RestaurantOS-only logic.
/**
 * Spreadable anchor props for a CTA href. Absolute http(s) URLs (a demo on
 * a different subdomain, a link back to maxpromo.digital, etc.) open in a
 * new tab with rel="noopener noreferrer" so the visitor never loses the
 * product page they were reading. Relative URLs ("/contact?...", "#top")
 * stay in the current tab — no change from prior behavior.
 *
 * Regex tightened 2026-07-25 (RestaurantOS correction, Marcel's item 3):
 * was `href.startsWith('http')`, which happened to work correctly for
 * every href actually used in this codebase (relative paths, `#anchor`,
 * and any future `mailto:`/`tel:` link all correctly evaluate to `false`
 * since none of them start with the literal string "http") but was a
 * loose, coincidental match rather than an intentional URL-scheme check.
 * `^https?:\/\//i` is explicit about what it's matching and can't be
 * accidentally satisfied by a non-URL string that happens to start with
 * "http". Verified: relative paths → false, `#top` → false,
 * `mailto:foo@bar.de` → false, `tel:+491234567` → false,
 * `https://demo.restaurant-os.de` → true.
 */
export function externalLinkProps(href: string): { target?: '_blank'; rel?: string } {
  return /^https?:\/\//i.test(href)
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}
}
