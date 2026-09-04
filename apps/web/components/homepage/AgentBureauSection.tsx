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

const WORKFLOW = {
  de: [
    { name: 'Audit',         caption: 'Abläufe prüfen' },
    { name: 'Diagnose',      caption: 'Engpässe finden' },
    { name: 'Agent Team',    caption: 'Aufgaben verteilen' },
    { name: 'Human Review',  caption: 'Mensch gibt frei', gate: true },
    { name: 'Execute',       caption: 'Aktion ausführen' },
    { name: 'Log',           caption: 'Alles dokumentiert' },
  ],
  en: [
    { name: 'Audit',         caption: 'Scan workflows' },
    { name: 'Diagnose',      caption: 'Find bottlenecks' },
    { name: 'Agent Team',    caption: 'Assign tasks' },
    { name: 'Human Review',  caption: 'Human approves', gate: true },
    { name: 'Execute',       caption: 'Run the action' },
    { name: 'Log',           caption: 'Everything logged' },
  ],
} as const

const CAPABILITY_GROUPS = {
  de: [
    {
      key: 'analyse', title: 'Analysieren & Vorbereiten', featured: false,
      items: [
        { key: 'audit',  icon: 'audit',  title: 'AI Audit Console',     body: 'Findet Engpässe, Risiken und Automatisierungschancen.', tags: ['Engpässe', 'Risiken'] },
        { key: 'intake', icon: 'intake', title: 'Document Intake Desk', body: 'Sortiert Dokumente, erkennt Lücken und bereitet Pakete vor.', tags: ['Dokumente', 'Lücken'] },
      ],
    },
    {
      key: 'coordinate', title: 'Koordinieren & Freigeben', featured: true,
      items: [
        { key: 'waiting',  icon: 'waiting',  title: 'Customer Waiting Room', body: 'Sammelt Anfragen, ordnet Prioritäten und hält Kunden sichtbar.', tags: ['Anfragen', 'Priorität'] },
        { key: 'approval', icon: 'approval', title: 'Approval Desk',         body: 'Entscheidungen bleiben kontrolliert, dokumentiert und freigabepflichtig.', tags: ['Kontrolle', 'Freigabe'] },
      ],
    },
    {
      key: 'monitor', title: 'Verfolgen & Kontrollieren', featured: false,
      items: [
        { key: 'shadow', icon: 'shadow', title: 'Shadow AI Governance', body: 'Zeigt, wo KI im Betrieb genutzt wird und wo Kontrolle fehlt.', tags: ['Transparenz', 'Kontrolle'] },
        { key: 'logs',   icon: 'logs',   title: 'Protokoll & Nachverfolgung', body: 'Jede Aktion protokolliert, mit Zeitstempel und Ergebnis.', tags: ['Protokoll', 'Zeitstempel'] },
      ],
    },
  ],
  en: [
    {
      key: 'analyse', title: 'Analyse & Prepare', featured: false,
      items: [
        { key: 'audit',  icon: 'audit',  title: 'AI Audit Console',     body: 'Identifies bottlenecks, risks, and automation opportunities.', tags: ['Bottlenecks', 'Risk'] },
        { key: 'intake', icon: 'intake', title: 'Document Intake Desk', body: 'Sorts documents, spots gaps, and prepares delivery packages.', tags: ['Documents', 'Gaps'] },
      ],
    },
    {
      key: 'coordinate', title: 'Coordinate & Approve', featured: true,
      items: [
        { key: 'waiting',  icon: 'waiting',  title: 'Customer Waiting Room', body: 'Collects requests, ranks priorities, keeps clients visible.', tags: ['Requests', 'Priority'] },
        { key: 'approval', icon: 'approval', title: 'Approval Desk',         body: 'Decisions stay controlled, documented, and approval-gated.', tags: ['Control', 'Approval'] },
      ],
    },
    {
      key: 'monitor', title: 'Monitor & Govern', featured: false,
      items: [
        { key: 'shadow', icon: 'shadow', title: 'Shadow AI Governance', body: 'Shows where AI is used in the business and where control is missing.', tags: ['Visibility', 'Control'] },
        { key: 'logs',   icon: 'logs',   title: 'Logs & Audit Trail',   body: 'Every action is logged, with a timestamp and outcome.', tags: ['Log', 'Timestamp'] },
      ],
    },
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
    text-align: center; padding: 8px; z-index: 2;
  }
  .hab-node {
    position: absolute; transform: translate(-50%, -50%);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    width: 92px; text-align: center; z-index: 2;
  }
  .hab-node-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: var(--brand-background); border: 1px solid ${BORDER};
    box-shadow: var(--shadow-sm);
    display: flex; align-items: center; justify-content: center;
    transition: border-color 200ms ease, transform 200ms ease;
  }
  .hab-node:hover .hab-node-icon { border-color: color-mix(in srgb, var(--brand-primary) 50%, transparent); transform: translateY(-2px); }

  .hab-workflow { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; }
  .hab-workflow::-webkit-scrollbar { height: 4px; }
  .hab-workflow::-webkit-scrollbar-thumb { background: var(--brand-border); border-radius: 4px; }
  .hab-step {
    scroll-snap-align: start; flex: 0 0 auto; display: flex; align-items: center; gap: 8px;
    background: var(--brand-background);
    border: 1px solid var(--brand-border); border-radius: 999px;
    padding: 10px 16px; white-space: nowrap;
  }
  .hab-step-gate {
    background: color-mix(in srgb, var(--brand-primary) 5%, transparent);
    border-color: color-mix(in srgb, var(--brand-primary) 40%, transparent);
  }
  .hab-step-arrow { flex: 0 0 auto; color: color-mix(in srgb, var(--brand-primary) 45%, transparent); font-size: 13px; }

  .hab-tag {
    display: inline-block; font-family: var(--brand-font-mono); font-size: 11px; letter-spacing: 0.02em;
    color: var(--brand-text-secondary); background: var(--brand-surface-subtle); border: 1px solid var(--brand-border);
    border-radius: 5px; padding: 2px 7px; margin: 8px 6px 0 0;
  }
  .hab-panel-featured .hab-tag { color: var(--brand-primary-text); background: color-mix(in srgb, var(--brand-primary) 8%, transparent); border-color: color-mix(in srgb, var(--brand-primary) 20%, transparent); }

  .hab-panel { transition: transform 200ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out; }
  .hab-panel:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
  .hab-panel-featured { border-width: 2px !important; }

  @media (min-width: 1024px) {
    .hab-capabilities { grid-template-columns: 1fr 1.14fr 1fr; align-items: stretch; }
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
  const flow   = isDE ? WORKFLOW.de : WORKFLOW.en
  const groups = isDE ? CAPABILITY_GROUPS.de : CAPABILITY_GROUPS.en

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
        <div className="hab-hero" style={{ marginBottom: '4rem' }}>

          {/* LEFT — headline, copy, CTAs, trust note */}
          <div>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', color: 'var(--brand-primary-text)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {'Max Agent Bureau'}
            </p>
            <h2 style={{ marginBottom: '1.25rem', maxWidth: '30rem' }}>
              {isDE
                ? <>Ein KI-Team, das Arbeit <span>vorbereitet, koordiniert und ausführt.</span></>
                : <>An AI team that <span>prepares, coordinates and executes work.</span></>}
            </h2>
            <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-body)', color: 'var(--brand-text-secondary)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '30rem' }}>
              {isDE
                ? 'Agent Bureau prüft Abläufe, verteilt Aufgaben, bereitet Entscheidungen vor und führt freigegebene Aktionen über Ihre Systeme hinweg aus.'
                : 'Agent Bureau audits your workflows, assigns tasks, prepares decisions, and executes approved actions across your business systems.'}
            </p>

            {/* Routing correction 2026-07-25: this homepage hero is an entry point,
                not the dedicated page — both CTAs now route to /systems/agent-bureau
                first. That page carries its own external product / contact CTA pair. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Link href="/agent-bureau" className="btn btn-primary">
                {isDE ? 'System ansehen →' : 'View system →'}
              </Link>
              <Link href="/agent-bureau" className="btn btn-secondary">
                {isDE ? 'Mehr erfahren →' : 'Learn more →'}
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

        {/* ─────────────────────────────────────────── WORKFLOW, compact connected strip */}
        <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
          {isDE ? 'Der Ablauf' : 'The workflow'}
        </p>
        <div className="hab-workflow" style={{ marginBottom: '3rem' }}>
          {flow.map((step, i) => (
            <div key={step.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={`hab-step${'gate' in step && step.gate ? ' hab-step-gate' : ''}`}>
                <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--brand-primary-text)', flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <span style={{ display: 'block', fontFamily: 'var(--brand-font-heading)', fontWeight: 'var(--weight-heading)', fontSize: '14px', color: 'var(--brand-text)', lineHeight: 1.2 }}>
                    {step.name}
                  </span>
                  <span style={{ display: 'block', fontFamily: 'var(--brand-font-body)', fontSize: '12px', color: 'gate' in step && step.gate ? 'var(--brand-primary-text)' : 'var(--brand-text-secondary)', lineHeight: 1.3 }}>
                    {step.caption}
                  </span>
                </span>
              </div>
              {i < flow.length - 1 && <span className="hab-step-arrow" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>

        {/* ─────────────────────────────────────────── CAPABILITIES, 3 grouped panels
            Featured (Coordinate & Approve) panel gets extra padding + a wider grid
            track (see .hab-capabilities @ ≥1024px) so it reads as the visual center
            of gravity rather than three identically-weighted boxes. */}
        <div className="hab-capabilities" style={{ display: 'grid', gap: '18px' }}>
          {groups.map((group) => (
            <div
              key={group.key}
              className={`hab-panel${group.featured ? ' hab-panel-featured' : ''}`}
              style={{
                background: group.featured ? 'color-mix(in srgb, var(--brand-primary) 3%, transparent)' : 'var(--brand-background)',
                border: `1px solid ${group.featured ? 'color-mix(in srgb, var(--brand-primary) 35%, transparent)' : 'var(--brand-border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: group.featured ? '30px 26px' : '24px',
                display: 'flex', flexDirection: 'column', gap: '18px',
              }}
            >
              <h3 className="h-card" style={{ color: 'var(--brand-text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                {group.title}
              </h3>
              {group.items.map((item) => (
                <div key={item.key} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: group.featured ? '40px' : '36px', height: group.featured ? '40px' : '36px',
                    borderRadius: '9px', background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CapabilityIcon name={item.icon} />
                  </span>
                  <div>
                    <p style={{ fontFamily: 'var(--brand-font-heading)', fontWeight: 'var(--weight-heading)', fontSize: group.featured ? '18px' : 'var(--text-body)', color: 'var(--brand-text)', letterSpacing: '-0.01em', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                      {item.title}
                    </p>
                    <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {item.body}
                    </p>
                    <div>
                      {item.tags.map((tag) => <span key={tag} className="hab-tag">{tag}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
