import Image from 'next/image'
import type { WorkflowTuple } from '@/lib/registry/types'

interface InActionProps {
  workflow:     WorkflowTuple
  cardImageSrc: string
  domainBrand:  string
  locale:       string
}

/**
 * Visual proof section, split layout.
 * Left: product card image (the system in action).
 * Right: 3 short observations derived from the first 3 workflow step labels.
 * Phase 3: replace with a real system screenshot / screen recording.
 */
export function InAction({ workflow, cardImageSrc, domainBrand, locale }: InActionProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? '// Das System in Aktion' : '// The system in action'
  const heading = isDE ? 'Live und in Betrieb.' : 'Live and running.'

  const observations = workflow.slice(0, 3) as unknown as [
    { label: string; description: string },
    { label: string; description: string },
    { label: string; description: string },
  ]

  return (
    <section id="see-in-action" style={{ padding: '5rem 2rem', borderTop: '1px solid rgba(128,128,128,0.10)' }}>
      <div
        style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gap: '4rem', alignItems: 'center' }}
        className="grid-cols-1 lg:grid-cols-2"
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '8 / 5', borderRadius: '12px', overflow: 'hidden', background: 'rgba(128,128,128,0.06)' }}>
          <Image
            src={cardImageSrc}
            alt={domainBrand}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </div>

        {/* Observations */}
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand-accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            {eyebrow}
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.03em', marginBottom: '2.5rem', lineHeight: 1.15 }}>
            {heading}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {observations.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brand-accent)', flexShrink: 0, marginTop: '3px', letterSpacing: '0.06em' }}>
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '16px', color: 'var(--brand-fg)', margin: 0, marginBottom: '4px', lineHeight: 1.3 }}>
                    {step.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--brand-muted)', lineHeight: 1.65, margin: 0 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
