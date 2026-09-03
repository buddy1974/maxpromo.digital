/**
 * components/ui/OperationsCenter.tsx
 *
 * The Maxpromo Operations Center — the hero's product visual.
 *
 * WHAT THIS IS NOT
 * Not a generic SaaS dashboard: no KPI cards with big percentages, no line
 * chart, no donut, no gradient tiles. Those are the template patterns that make
 * a site read as AI-generated, and an analytics screenshot would in any case
 * misrepresent the product — Maxpromo builds operating systems, not reporting.
 *
 * WHAT IT IS
 * The visual argument for the headline. The claim is "we build the systems a
 * company runs on", so the interface shows exactly that: named business systems
 * with real operational state, and the work waiting on a human. It is dense,
 * structured and quiet — the way internal operations software actually looks
 * when it is used all day rather than demonstrated once.
 *
 * Deliberately a server component with no client JavaScript: this renders above
 * the fold, and a hero that ships an animation runtime to draw a static picture
 * is the opposite of the engineering discipline the page is claiming.
 *
 * Colour: greyscale, with the accent reserved for the single active row. That
 * is permitted job (b) of the three the accent has — active/current state.
 */

interface SystemRow {
  name: string
  detail: string
  state: 'running' | 'attention' | 'scheduled'
}

interface OperationsCenterProps {
  /** Panel title — the module currently in view. */
  title: string
  /** Left-rail module names, in operational order. */
  modules: readonly string[]
  /** Index of the module in view. Receives the accent. */
  activeModule: number
  systems: readonly SystemRow[]
  /** Bottom band: work waiting on a person. */
  queueLabel: string
  queue: readonly string[]
  footnote: string
}

const STATE_MARK: Record<SystemRow['state'], string> = {
  running: '●',
  attention: '▲',
  scheduled: '◷',
}

export function OperationsCenter({
  title,
  modules,
  activeModule,
  systems,
  queueLabel,
  queue,
  footnote,
}: OperationsCenterProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        border: '1px solid var(--brand-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--brand-surface)',
        overflow: 'hidden',
        fontFamily: 'var(--brand-font-sans)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          padding: '10px 14px',
          borderBottom: '1px solid var(--brand-border)',
          background: 'var(--brand-surface-subtle)',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: 'var(--tracking-label)',
            textTransform: 'uppercase',
            color: 'var(--brand-text)',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: 'var(--brand-font-mono)',
            fontSize: '11px',
            color: 'var(--brand-text-muted)',
          }}
        >
          maxpromo.os
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,9.5rem) 1fr' }} className="oc-body">
        {/* Module rail */}
        <nav
          style={{
            borderRight: '1px solid var(--brand-border)',
            padding: '10px 0',
            background: 'var(--brand-surface)',
          }}
          className="oc-rail"
        >
          {modules.map((m, i) => {
            const active = i === activeModule
            return (
              <div
                key={m}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  lineHeight: 1.4,
                  color: active ? 'var(--brand-text)' : 'var(--brand-text-muted)',
                  fontWeight: active ? 600 : 400,
                  borderLeft: active
                    ? '2px solid var(--brand-primary)'
                    : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m}
              </div>
            )
          })}
        </nav>

        {/* Systems table */}
        <div style={{ minWidth: 0 }}>
          {systems.map((s) => (
            <div
              key={s.name}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--space-3)',
                padding: '11px 14px',
                borderBottom: '1px solid var(--brand-border)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--brand-font-mono)',
                  fontSize: '10px',
                  lineHeight: 1.6,
                  color:
                    s.state === 'attention'
                      ? 'var(--semantic-warning)'
                      : s.state === 'scheduled'
                        ? 'var(--brand-text-muted)'
                        : 'var(--semantic-success)',
                  flexShrink: 0,
                }}
              >
                {STATE_MARK[s.state]}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--brand-text)',
                  flexShrink: 0,
                }}
              >
                {s.name}
              </span>
              <span
                style={{
                  fontFamily: 'var(--brand-font-mono)',
                  fontSize: '11px',
                  color: 'var(--brand-text-muted)',
                  marginLeft: 'auto',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.detail}
              </span>
            </div>
          ))}

          {/* Approval queue — the human stays in the loop, which is the product. */}
          <div style={{ padding: '12px 14px', background: 'var(--brand-surface-subtle)' }}>
            <p
              style={{
                margin: '0 0 8px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-label)',
                textTransform: 'uppercase',
                color: 'var(--brand-text-secondary)',
              }}
            >
              {queueLabel}
            </p>
            {queue.map((q) => (
              <p
                key={q}
                style={{
                  margin: '0 0 5px',
                  fontFamily: 'var(--brand-font-mono)',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: 'var(--brand-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {q}
              </p>
            ))}
            <p
              style={{
                margin: '10px 0 0',
                fontSize: '11px',
                color: 'var(--brand-text-muted)',
              }}
            >
              {footnote}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
