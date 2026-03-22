import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Transparent pricing for AI automation, agentic workflows, and AI-powered websites.',
}

const TIERS = [
  {
    name: 'Starter',
    price: '£2,500',
    period: 'one-time',
    tag: null,
    description: 'For small businesses and teams automating their first core workflow.',
    includes: [
      '1 automation workflow built end-to-end',
      'Up to 3 tool integrations',
      'Discovery call and process mapping',
      'Testing and quality assurance',
      '30-day post-launch support',
      'Handover documentation',
    ],
    cta: 'Start with Starter',
    href: '/contact',
    featured: false,
  },
  {
    name: 'Growth',
    price: '£6,500',
    period: 'one-time',
    tag: 'Most Popular',
    description: 'For growing businesses ready to automate multiple workflows and integrate AI agents.',
    includes: [
      'Up to 4 automation workflows',
      'Unlimited tool integrations',
      'AI agent design and deployment',
      'Custom API development',
      'Priority build queue',
      '90-day post-launch support',
      'Monthly performance review',
      'Dedicated Slack channel',
    ],
    cta: 'Start with Growth',
    href: '/contact',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'quoted',
    tag: null,
    description: 'For organisations requiring full automation ecosystems, ongoing retainers, and dedicated support.',
    includes: [
      'Unlimited workflows and agents',
      'Full automation architecture design',
      'Ongoing development retainer',
      'Dedicated automation engineer',
      'SLA-backed uptime guarantee',
      'Quarterly strategy reviews',
      'Staff training and onboarding',
      'White-label options available',
    ],
    cta: 'Discuss Enterprise',
    href: '/contact',
    featured: false,
  },
]

const FAQS = [
  {
    q: 'Do you offer ongoing maintenance?',
    a: 'Yes. All tiers include post-launch support. Beyond that, we offer monthly retainer packages for ongoing development, monitoring, and optimisation — priced based on scope.',
  },
  {
    q: 'How long does a typical project take?',
    a: 'Starter projects typically take 3–4 weeks. Growth engagements run 6–10 weeks. Enterprise timelines are scoped during the discovery phase. Most clients go live within 60–90 days of kick-off.',
  },
  {
    q: 'What if my needs don\'t fit a tier?',
    a: 'All projects start with a free discovery call. We scope every engagement individually — the tiers above are indicative guides, not rigid packages. Contact us and we\'ll provide a tailored quote.',
  },
  {
    q: 'Is there a minimum commitment?',
    a: 'No long-term contracts on project work. Our retainer arrangements have a 3-month minimum, after which you can adjust or cancel with 30 days notice.',
  },
]

const mono = { fontFamily: 'var(--font-space-mono)' } as const
const grotesk = { fontFamily: 'var(--font-space-grotesk)' } as const
const sans = { fontFamily: 'var(--font-dm-sans)' } as const

export default function PricingPage() {
  return (
    <main style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Pricing
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: '20px' }}>
            Transparent, project-based pricing
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: '#555555', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.8 }}>
            No retainer lock-ins on project work. No hidden fees. Every engagement starts
            with a free audit to ensure we scope accurately before any commitment.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section style={{ background: '#FAFAFA', padding: '4rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gap: '1px', background: '#E5E5E5', alignItems: 'start' }}
            className="grid-cols-1 lg:grid-cols-3"
          >
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                style={{
                  background: tier.featured ? '#0A0A0A' : '#FFFFFF',
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {tier.tag && (
                  <span
                    style={{
                      ...mono,
                      fontSize: '10px',
                      color: '#0A0A0A',
                      background: '#F97316',
                      padding: '4px 10px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      display: 'inline-block',
                      marginBottom: '20px',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {tier.tag}
                  </span>
                )}

                <p
                  style={{
                    ...mono,
                    fontSize: '11px',
                    color: tier.featured ? '#6B6B7A' : '#AAAAAA',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                    marginTop: tier.tag ? '0' : '0',
                  }}
                >
                  {tier.name}
                </p>

                <p
                  style={{
                    ...grotesk,
                    fontWeight: 700,
                    fontSize: '48px',
                    color: tier.featured ? '#FAFAFF' : '#0A0A0A',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}
                >
                  {tier.price}
                </p>
                <p style={{ ...mono, fontSize: '12px', color: tier.featured ? '#6B6B7A' : '#AAAAAA', marginBottom: '20px', letterSpacing: '0.05em' }}>
                  {tier.period}
                </p>

                <p style={{ ...sans, fontSize: '15px', color: tier.featured ? '#9B9BAA' : '#666666', lineHeight: 1.7, marginBottom: '28px' }}>
                  {tier.description}
                </p>

                <div
                  style={{
                    borderTop: tier.featured ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F0F0F0',
                    paddingTop: '24px',
                    marginBottom: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flex: 1,
                  }}
                >
                  {tier.includes.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ color: '#F97316', flexShrink: 0, ...mono, fontSize: '13px' }}>✓</span>
                      <span style={{ ...sans, fontSize: '14px', color: tier.featured ? '#CCCCCC' : '#444444', lineHeight: 1.5 }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href={tier.href}
                  style={{
                    ...mono,
                    fontWeight: 700,
                    fontSize: '14px',
                    color: tier.featured ? '#0A0A0A' : '#0A0A0A',
                    background: '#F97316',
                    padding: '14px 24px',
                    textDecoration: 'none',
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  {tier.cta} →
                </Link>
              </div>
            ))}
          </div>

          <p style={{ ...mono, fontSize: '11px', color: '#AAAAAA', textAlign: 'center', marginTop: '20px', letterSpacing: '0.05em' }}>
            // All projects begin with a free discovery call. Prices are indicative — final quote provided after scoping.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            FAQ
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: '3rem' }}>
            Common questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                style={{
                  borderTop: '1px solid #E5E5E5',
                  padding: '2rem 0',
                  borderBottom: i === FAQS.length - 1 ? '1px solid #E5E5E5' : 'none',
                }}
              >
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '18px', color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: '12px' }}>
                  {faq.q}
                </h3>
                <p style={{ ...sans, fontSize: '16px', color: '#555555', lineHeight: 1.8 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0A0A0A', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Start Today
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#FAFAFF', marginBottom: '20px' }}>
            Not sure which tier fits?
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: '#6B6B7A', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            Run the free audit first. We&apos;ll tell you exactly what we&apos;d recommend — before
            any commitment or cost.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/automation-audit"
              style={{
                ...mono,
                fontWeight: 700,
                fontSize: '15px',
                color: '#0A0A0A',
                background: '#F97316',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Run Free Audit
            </Link>
            <Link
              href="/contact"
              style={{
                ...sans,
                fontWeight: 500,
                fontSize: '15px',
                color: '#FAFAFF',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Contact Us
            </Link>
          </div>
          <p style={{ ...mono, fontSize: '11px', color: '#6B6B7A', marginTop: '20px', letterSpacing: '0.05em' }}>
            // Free audit · No commitment · 3 onboarding slots open this month
          </p>
        </div>
      </section>
    </main>
  )
}
