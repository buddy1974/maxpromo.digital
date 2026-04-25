'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FAQS = [
  {
    q: 'How long does it take to build and deploy an automation?',
    a: 'Most single automations go live in 7-14 days. Complex multi-system builds take 3-6 weeks. We work in clear phases: scope, build, test, launch. You always know where we are.',
  },
  {
    q: 'Do I need technical knowledge to use what you build?',
    a: 'No. We build systems that run themselves. You get a simple dashboard or Slack/email reporting. No CLI. No logins to configure. If something breaks, we fix it.',
  },
  {
    q: 'What tools do you actually use?',
    a: 'n8n and Make for workflow automation. Claude API and OpenAI for AI agents. Next.js for web platforms. Supabase and Neon PostgreSQL for data. Cloudflare for infrastructure. We pick the right tool for the job, not the one we want to bill hours on.',
  },
  {
    q: 'Will this work with our existing software?',
    a: "If it has an API, we can connect to it. We've integrated HubSpot, Xero, Notion, Slack, Gmail, Stripe, Airtable, Shopify, and 40+ others. Bespoke integrations are built where needed.",
  },
  {
    q: 'What happens after you build it?',
    a: "All our builds include a handover, documentation, and a support window (30-60 days depending on plan). After that, you can self-manage or take a retainer for ongoing support, monitoring, and iteration.",
  },
  {
    q: 'Is the free audit actually free?',
    a: "Yes. No sales call, no invoice. You complete a 5-minute form, our AI analyses your workflows, and you get a prioritised action plan. You can then decide if you want to work with us. There is no obligation.",
  },
]

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

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
            // 05 — FAQ
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
            }}
          >
            Common questions
          </h2>
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '800px' }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="glass"
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: open === i
                  ? '1px solid hsl(28 100% 58% / 0.2)'
                  : '1px solid hsl(40 30% 96% / 0.06)',
                transition: 'border-color 200ms ease',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: '1rem',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                    fontSize: '17px',
                    color: 'hsl(40 30% 96%)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.4,
                  }}
                >
                  {faq.q}
                </span>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: open === i ? 'hsl(28 100% 58%)' : 'hsl(240 10% 16%)',
                    color: open === i ? 'hsl(240 14% 4%)' : 'hsl(40 30% 96%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                    transition: 'background 200ms ease, color 200ms ease',
                  }}
                >
                  {open === i ? '−' : '+'}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '15px',
                        color: 'hsl(40 12% 65%)',
                        lineHeight: 1.75,
                        padding: '0 1.5rem 1.5rem',
                      }}
                    >
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
