import { headers } from 'next/headers'

/**
 * components/landing/LandingThemeProvider.tsx
 *
 * Establishes the showcase surface for the product landing engine.
 *
 * ── TWO-TIER BRAND (v4.0) ──────────────────────────────────────────────────
 * The mechanism for this already existed and was never used for colour: the
 * Domain Registry (packages/config/domains.ts) classifies every host, and
 * middleware.ts stamps x-mp-mode on every request. This component reads it.
 *
 *   hub      — maxpromo.digital, including /systems/*. Renders in the Maxpromo
 *              accent, always. A visitor here is a Maxpromo prospect and must
 *              see one company; a product page rendering in its own colour
 *              inside Maxpromo's own navigation was the most direct
 *              contradiction of that.
 *   showcase — restaurant-os.de, superhandwerk.de, and the other product
 *              domains. A restaurant owner on restaurant-os.de is buying
 *              RestaurantOS, so product identity is legitimate there. Exactly
 *              one token varies: the accent. Everything else — typography,
 *              spacing, radius, surfaces, components — is the platform system.
 *
 * ── SUPERSEDED RULES ───────────────────────────────────────────────────────
 * VG-01 (dark background by default, #080808), VG-02 (accent reserved for
 * headline marks) and VG-03 (CTA buttons locked to the hex #F97316, deliberately not a
 * variable) are retired. The platform is a light system and the accent is a
 * token; a locked hex that "must render identically on every product" is the
 * exact mechanism that would have re-applied the retired orange after the
 * brand migration.
 *
 * The custom properties are named --showcase-* rather than --brand-*: the
 * platform token layer owns the --brand-* namespace, and two systems using one
 * prefix for different values is how the codebase ended up with three parallel
 * design systems in the first place.
 */

interface LandingThemeProviderProps {
  /** Product accent from the registry. Honoured on showcase domains only. */
  /** The product's accent. A fill. */
  brandColor: string
  /**
   * The accent as text, at 5:1 or better on white.
   *
   * Two components colour text with the accent — the FAQ toggle and the
   * onboarding step label — and four of the eleven product accents fail
   * contrast as text: Brand Lime at 1.51:1, CareOS teal at 2.49:1, Drive24
   * green at 3.68:1, PrintShopOS magenta at 4.25:1. The platform's own accent
   * has had a separate text form since v3; product accents were never held to
   * the same rule because check:tokens only knew about --brand-primary.
   */
  brandColorText: string
  children: React.ReactNode
}

export async function LandingThemeProvider({
  brandColor,
  brandColorText,
  children,
}: LandingThemeProviderProps) {
  const h = await headers()
  const isShowcase = h.get('x-mp-mode') === 'showcase'

  return (
    <div
      style={
        {
          '--showcase-accent': isShowcase ? brandColor : 'var(--brand-primary)',
          '--showcase-accent-text': isShowcase ? brandColorText : 'var(--brand-primary-text)',
          '--showcase-bg': 'var(--brand-background)',
          '--showcase-fg': 'var(--brand-text)',
          '--showcase-muted': 'var(--brand-text-secondary)',
          background: 'var(--brand-background)',
          color: 'var(--brand-text)',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
