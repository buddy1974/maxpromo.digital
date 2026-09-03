export interface ProofMetric {
  id: string
  value: string
  label: string
  source: string
}

interface ProofMetricsProps {
  metrics: ProofMetric[]
}

/**
 * components/homepage/ProofMetrics.tsx
 *
 * Sourced figures, in a hairline grid.
 *
 * Was the last consumer of framer-motion in the platform — a ~110 KB animation
 * runtime shipped to the browser to fade three numbers in on scroll. The same
 * effect is a CSS scroll-driven animation with a static fallback, so this is
 * now a server component and the dependency is gone.
 *
 * Each figure carries its source. A metric without one is a claim, and this
 * platform does not print claims it cannot evidence.
 */
export function ProofMetrics({ metrics }: ProofMetricsProps) {
  return (
    <div className="metric-grid">
      {metrics.map((m, i) => (
        <div
          key={m.id}
          className="metric-cell"
          // Stagger without JavaScript: each cell offsets its own animation.
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <p className="metric-value">{m.value}</p>
          <p className="metric-label">{m.label}</p>
          <p className="metric-source">{m.source}</p>
        </div>
      ))}
    </div>
  )
}
