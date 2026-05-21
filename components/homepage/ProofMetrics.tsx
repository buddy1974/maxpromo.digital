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
      style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
      className="grid-cols-1 sm:grid-cols-3"
    >
      {metrics.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: 'hsl(240 12% 7%)', padding: '2.5rem' }}
        >
          {/* Value — fades in, tiny upward tick, single soft pulse via scale */}
          <motion.p
            initial={{ opacity: 0, y: 8, scale: 1.02 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: i * 0.1 + 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.04em',
              color: '#F97316',
              lineHeight: 1,
              marginBottom: '12px',
            }}
          >
            {m.value}
          </motion.p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', lineHeight: 1.5, marginBottom: '10px' }}>
            {m.label}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(40 12% 50%)', letterSpacing: '0.05em' }}>
            {m.source}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
