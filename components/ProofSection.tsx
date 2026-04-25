'use client'

import { motion } from 'framer-motion'

const RESULTS = [
  { number: '78%', label: 'reduction in manual processing time', client: 'Operations team, UK logistics co.' },
  { number: '32h', label: 'saved per week, first month live', client: 'Founder, German trades business' },
  { number: '3×', label: 'lead response speed after agent deploy', client: 'Sales director, SaaS company' },
]

const QUOTES = [
  {
    quote: "We went from 40 hours of manual invoicing per week to under 4. The agent just runs. I forgot it was there until the report landed in my inbox.",
    role: "Head of Operations",
    context: "Manufacturing, 80-person company",
  },
  {
    quote: "I was sceptical. We had tried Make and Zapier before and nothing stuck. MAXPROMO built something that actually understood our business logic.",
    role: "Founder",
    context: "UK care management platform",
  },
]

export default function ProofSection() {
  return (
    <section style={{ padding: '6rem 2rem', background: 'hsl(240 14% 4%)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3.5rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'hsl(28 100% 58%)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            // 02 — RESULTS
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '0',
            }}
          >
            Numbers from{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              live systems
            </span>
          </h2>
        </div>

        {/* Results cards */}
        <div
          style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', marginBottom: '3rem', borderRadius: '16px', overflow: 'hidden' }}
          className="grid-cols-1 md:grid-cols-3"
        >
          {RESULTS.map((r, i) => (
            <motion.div
              key={r.label}
              className="border-gradient"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'hsl(240 12% 7%)',
                padding: '2.5rem',
                borderRadius: '0',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 'clamp(3rem, 5vw, 4rem)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  marginBottom: '12px',
                  background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {r.number}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 30% 96%)', lineHeight: 1.5, marginBottom: '12px' }}>
                {r.label}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', letterSpacing: '0.05em' }}>
                — {r.client}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div
          style={{ display: 'grid', gap: '1rem' }}
          className="grid-cols-1 md:grid-cols-2"
        >
          {QUOTES.map((q, i) => (
            <motion.blockquote
              key={i}
              className="glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                margin: 0,
                padding: '2rem',
                borderRadius: '16px',
                position: 'relative',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '80px',
                  lineHeight: 0.8,
                  color: 'hsl(28 100% 58% / 0.2)',
                  display: 'block',
                  marginBottom: '1rem',
                }}
              >
                &ldquo;
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  color: 'hsl(40 30% 96%)',
                  lineHeight: 1.7,
                  marginBottom: '1.5rem',
                  fontStyle: 'italic',
                }}
              >
                {q.quote}
              </p>
              <figcaption
                style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid hsl(40 30% 96% / 0.06)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(28 100% 58%)', marginBottom: '2px' }}>
                  {q.role}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)' }}>
                  {q.context}
                </p>
              </figcaption>
            </motion.blockquote>
          ))}
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)', textAlign: 'center', marginTop: '2rem', letterSpacing: '0.05em' }}>
          // Names withheld under NDA. The systems are live.
        </p>
      </div>
    </section>
  )
}
