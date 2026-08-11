'use client'

import { motion } from 'framer-motion'

export interface ProofMetric {
  id: string
  value: string
  label: string
  source: string
}

interface ProofMetricsProps {
  metrics: ProofMetric[]
}

export function ProofMetrics({ metrics }: ProofMetricsProps) {
  return (
    <div
      style={{ display: 'grid', gap: '1px', background: 'var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--color-border)' }}
      className="grid-cols-1 sm:grid-cols-3"
    >
      {metrics.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: 'var(--color-bg)', padding: 'clamp(1.5rem, 5vw, 2.75rem)' }}
        >
          {/* Value, fades in, tiny upward tick, single soft pulse via scale */}
          <motion.p
            initial={{ opacity: 0, y: 8, scale: 1.02 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: i * 0.1 + 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.25rem, 4vw, 3.25rem)',
              letterSpacing: '-0.02em',
              color: 'var(--color-primary)',
              lineHeight: 1,
              marginBottom: '12px',
            }}
          >
            {m.value}
          </motion.p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-primary)', lineHeight: 1.5, marginBottom: '10px' }}>
            {m.label}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)', letterSpacing: '0.04em' }}>
            {m.source}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
