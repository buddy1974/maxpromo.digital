import { EYEBROW_STYLE, RADIUS, SECTION_PADDING, SECTION_DIVIDER, CARD_BORDER } from '@/components/landing/showcaseTokens'
import { Icon } from '@maxpromo/ui'

interface TrustAndSecurityProps {
  complianceNote: string | null
  locale:         string
}

/**
 * Required by the shared architecture (section 13, "Security and trust")
 * and the V2 block list (item 11). Only truthful, structural claims —
 * per governance section 7, never invented logos/testimonials/ratings/
 * certifications/user counts/uptime guarantees/awards.
 *
 * The 3 base bullets are universal facts about how every Maxpromo
 * product is deployed (own domain/branding, direct support, per-business
 * setup) — true by construction of the registry (every ProductEntry has
 * its own `domain`, `systemUrl`, `contactSlug`), not a per-product claim
 * that needs separate verification. `complianceNote` adds one
 * product-specific line when present (e.g. HandwerkOS's XRechnung
 * support) — restates a fact already stated in that product's own
 * workflow copy, never a new claim.
 *
 * Corrected 2026-07-25 (Marcel's V2 review — found while re-checking
 * HandwerkOS's trustCue against the same standard Marcel applied to it):
 * this component previously asserted "Eigene Domain, eigene Daten" /
 * "your own domain, your own data" (implying a specific, unverified
 * data-processing architecture) and "Kein Vendor-Lock-in — Sie besitzen
 * das System" / "no vendor lock-in — you own the system" (an ownership
 * claim that depends on `revenueModel` and is not true for every
 * product). Replaced with claims that hold for every registry entry
 * regardless of revenue model.
 *
 * Heading corrected 2026-07-25 (Marcel's visual-polish pass, TRUST
 * instruction — "no unsupported claims, no legal implications"): the old
 * heading, "Läuft auf Ihrer Infrastruktur." / "Runs on your
 * infrastructure.", directly contradicted Onboarding.tsx's own copy two
 * sections later ("Wir installieren, übernehmen Hosting und Support" /
 * "We install it, handle hosting and support") — Maxpromo hosts the
 * product, the client does not run it on their own infrastructure. Fixed
 * to a claim consistent with the rest of the page: branded delivery, not
 * infrastructure ownership.
 */
export function TrustAndSecurity({ complianceNote, locale }: TrustAndSecurityProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? 'Sicherheit & Vertrauen' : 'Security & trust'
  const heading = isDE ? 'Gebaut für Ihr Unternehmen.' : 'Built for your business.'

  const points = isDE
    ? ['Eigene Domain, eigenes Branding', 'Direkter Support von Maxpromo', 'Individuell für Ihren Betrieb eingerichtet']
    : ['Your own domain, your own branding', 'Direct support from Maxpromo', 'Set up specifically for your business']

  return (
    <section style={{ padding: SECTION_PADDING.base, borderTop: SECTION_DIVIDER }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: 'var(--space-3)' }}>
          {eyebrow}
        </p>
        <h2 style={{ marginBottom: 'var(--space-6)' }}>
          {heading}
        </h2>

        <div style={{ display: 'grid', gap: 'var(--space-3)' }} className="grid-cols-1 md:grid-cols-3">
          {points.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '1.25rem', border: CARD_BORDER, borderRadius: RADIUS.md }}>
              <span style={{ color: 'var(--showcase-muted)', flexShrink: 0, fontSize: '14px', marginTop: '2px' }}><Icon name="check" size="sm" /></span>
              <span style={{ fontFamily: 'var(--brand-font-body)', fontSize: '14px', color: 'var(--showcase-fg)', lineHeight: 1.5 }}>{p}</span>
            </div>
          ))}
        </div>

        {complianceNote && (
          <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-micro)', color: 'var(--showcase-muted)', marginTop: 'var(--space-5)', lineHeight: 1.7 }}>
            → {complianceNote}
          </p>
        )}
      </div>
    </section>
  )
}
