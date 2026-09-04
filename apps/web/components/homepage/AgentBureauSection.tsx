import { Link } from '@/i18n/navigation'

/**
 * components/homepage/AgentBureauSection.tsx
 *
 * Homepage "Max Agent Bureau" hero — redesigned 2026-07-25 from the original
 * full-width, six-equal-box layout (see git history on app/[locale]/page.tsx
 * for the previous version). Extracted out of page.tsx into its own
 * component, matching the pattern already used by SystemsTabs / PainCards /
 * ProofMetrics / TeamTrust / FaqAccordion.
 *
 * No client-side state — every interaction (hover, reduced-motion) is CSS
 * only, so this stays a plain server component like the rest of the page.
 *
 * Visual-facelift v2.1 pass: recolored to the light enterprise system. The
 * orbit diagram (central node + 6 connected capability nodes) is kept as an
 * informational visualization — it explains how Agent Bureau coordinates
 * work — but its decorative glow/dot-grid backdrop and pulsing box-shadow
 * are removed.
 */

const BORDER = 'var(--brand-border)'

// =============================================================================
// COPY — DE/EN inline, matching this file's existing convention throughout
// app/[locale]/page.tsx (this section was never wired to the next-intl
// message catalog; the orphaned `agentBureau.*` keys in messages/*.json
// pre-date this component and are unrelated).
// =============================================================================

const ORBIT_NODES = {
  de: [
    { key: 'inquiries', label: 'Kundenanfragen' },
    { key: 'documents', label: 'Dokumente' },
    { key: 'approvals', label: 'Freigaben' },
    { key: 'tasks',     label: 'Aufgaben' },
    { key: 'reports',   label: 'Berichte' },
    { key: 'systems',   label: 'Systeme' },
  ],
  en: [
    { key: 'inquiries', label: 'Enquiries' },
    { key: 'documents', label: 'Documents' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'tasks',     label: 'Tasks' },
    { key: 'reports',   label: 'Reports' },
    { key: 'systems',   label: 'Systems' },
  ],
} as const

// =============================================================================
// ICONS — inline SVG, matching the existing icon style already used across
// this page (stroke-based, 1.75–2px width, no fills)
// =============================================================================

function OrbitIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'var(--brand-primary-text)', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  switch (name) {
    case 'inquiries': return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    case 'documents': return <svg {...common}><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>
    case 'approvals': return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
    case 'tasks':      return <svg {...common}><rect x="3" y="5" width="6" height="6" rx="1" /><path d="m4.5 8 1 1 2-2" /><path d="M12 7h9M12 17h9" /><rect x="3" y="15" width="6" height="6" rx="1" /></svg>
    case 'reports':    return <svg {...common}><path d="M3 3v18h18" /><path d="M7 15v3M12 11v7M17 7v11" /></svg>
    case 'systems':    return <svg {...common}><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" /><path d="M8.5 7.5 10.5 15.5M15.5 7.5 13.5 15.5M9 6h6" /></svg>
    default: return null
  }
}

function CapabilityIcon({ name }: { name: string }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'var(--brand-primary-text)', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  switch (name) {
    case 'audit':    return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" /></svg>
    case 'waiting':  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'approval': return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
    case 'intake':   return <svg {...common}><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M9 13h6M9 17h4" /></svg>
    case 'shadow':   return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
    case 'logs':     return <svg {...common}><path d="M4 6h16M4 12h16M4 18h10" /></svg>
    default: return null
  }
}

// =============================================================================
// SCOPED STYLES — radial diagram positioning is easier to express in real
// CSS than as inline style objects; kept local to this component (not
// added to globals.css) so the diff stays self-contained.
// =============================================================================

const STYLES = `
  .hab-hero { display: grid; grid-template-columns: 1.05fr 1fr; gap: 3.5rem; align-items: center; }
  .hab-orbit-wrap { position: relative; aspect-ratio: 1 / 1; max-width: 440px; margin: 0 auto; }
  .hab-line { stroke: color-mix(in srgb, var(--brand-primary) 35%, transparent); stroke-width: 0.6; stroke-dasharray: 3 3; }
  .hab-line-anim { animation: hab-dash 3s linear infinite; }
  @keyframes hab-dash { to { stroke-dashoffset: -12; } }
  .hab-center {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    width: 108px; height: 108px; border-radius: 50%;
    background: var(--brand-primary);
    text-align: center; padding: var(--space-2); z-index: 2;
  }
  .hab-node {
    position: absolute; transform: translate(-50%, -50%);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    width: 92px; text-align: center; z-index: 2;
  }
  .hab-node-icon {
    width: 40px; height: 40px; border-radius: var(--radius-lg);
    background: var(--brand-background); border: 1px solid ${BORDER};
    box-shadow: var(--shadow-sm);
    display: flex; align-items: center; justify-content: center;
    transition: border-color var(--duration-base) var(--ease), transform var(--duration-base) var(--ease);
  }
  .hab-node:hover .hab-node-icon { border-color: color-mix(in srgb, var(--brand-primary) 50%, transparent); transform: translateY(-2px); }

  @media (min-width: 1024px) {
  }

  @media (max-width: 900px) {
    .hab-hero { grid-template-columns: 1fr; gap: 2.5rem; }
    .hab-orbit-wrap { max-width: 340px; }
  }
  @media (max-width: 640px) {
    .hab-orbit-wrap { max-width: 280px; }
    .hab-node { width: 76px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hab-line-anim { animation: none; }
    .hab-panel:hover, .hab-node:hover .hab-node-icon { transform: none; }
  }
`

// =============================================================================
// COMPONENT
// =============================================================================

export function AgentBureauSection({ locale }: { locale: string }) {
  const isDE   = locale === 'de'
  const nodes  = isDE ? ORBIT_NODES.de : ORBIT_NODES.en

  // 6 nodes evenly spaced around the circle, starting at 12 o'clock.
  const RADIUS = 42
  const positions = nodes.map((_, i) => {
    const angle = (-90 + i * 60) * (Math.PI / 180)
    return {
      x: 50 + RADIUS * Math.cos(angle),
      y: 50 + RADIUS * Math.sin(angle),
    }
  })

  return (
    <section id="agent-bureau" data-section="agent-bureau" style={{ background: 'var(--brand-surface-subtle)', padding: 'var(--section-y) var(--section-x)', borderTop: '1px solid var(--brand-border)' }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>

        {/* ─────────────────────────────────────────── HERO, two columns */}
        <div className="hab-hero" style={{ marginBottom: 'var(--space-10)' }}>

          {/* LEFT — headline, copy, CTAs, trust note */}
          <div>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', color: 'var(--brand-primary-text)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 'var(--space-4)' }}>
              {'Max Agent Bureau'}
            </p>
            <h2 style={{ marginBottom: '1.25rem', maxWidth: '30rem' }}>
              {isDE
                ? <>Ihr Team trifft dieselben Entscheidungen. <span>Es bereitet sie nicht mehr selbst vor.</span></>
                : <>Your team makes the same decisions. <span>It no longer prepares them alone.</span></>}
            </h2>
            <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-body)', color: 'var(--brand-text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-6)', maxWidth: '30rem' }}>
              {isDE
                ? 'Agent Bureau prüft Abläufe, verteilt Aufgaben, bereitet Entscheidungen vor und führt freigegebene Aktionen über Ihre Systeme hinweg aus.'
                : 'Agent Bureau audits your workflows, assigns tasks, prepares decisions, and executes approved actions across your business systems.'}
            </p>

            {/* One destination, one button. This carried two — "View system" and
                "Learn more" — pointing at the same page under different names,
                which asks the reader to choose between two words for one act. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <Link href="/agent-bureau" className="btn btn-primary">
                {isDE ? 'Agent Bureau ansehen →' : 'See Agent Bureau →'}
              </Link>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', maxWidth: '100%' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.01em', lineHeight: 1.6, margin: 0 }}>
                {isDE
                  ? 'Keine autonome Ausführung. Jede kritische Aktion bleibt freigabepflichtig.'
                  : 'No autonomous execution. Every critical action requires human approval.'}
              </p>
            </div>
          </div>

          {/* RIGHT — orchestration diagram: central Agent Bureau node + 6 connected capability nodes */}
          <div
            className="hab-orbit-wrap"
            role="img"
            aria-label={isDE
              ? 'Diagramm: Agent Bureau koordiniert Kundenanfragen, Dokumente, Freigaben, Aufgaben, Berichte und Systeme.'
              : 'Diagram: Agent Bureau coordinates enquiries, documents, approvals, tasks, reports and systems.'}
          >
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
              {positions.map((p, i) => (
                <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} className="hab-line hab-line-anim" />
              ))}
            </svg>

            <div className="hab-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-text-inverted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" />
                <path d="M8.5 7.5 10.5 15.5M15.5 7.5 13.5 15.5M9 6h6" />
              </svg>
              <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label-dense)', fontWeight: 700, color: 'var(--brand-text-inverted)', letterSpacing: '0.04em', marginTop: '6px', lineHeight: 1.25 }}>
                AGENT<br />BUREAU
              </span>
            </div>

            {nodes.map((node, i) => (
              <div key={node.key} className="hab-node" style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}>
                <span className="hab-node-icon"><OrbitIcon name={node.key} /></span>
                <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', letterSpacing: '0.01em', lineHeight: 1.3 }}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
