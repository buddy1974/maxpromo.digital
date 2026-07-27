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
 */

const ORANGE = '#F97316'
const BORDER = 'hsl(40 30% 96% / 0.08)'

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
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: ORANGE, strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
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
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: ORANGE, strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
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
  .hab-orbit-glow {
    position: absolute; inset: -10%; border-radius: 50%;
    background: radial-gradient(circle, hsl(24 100% 55% / 0.16), transparent 68%);
    pointer-events: none;
  }
  .hab-orbit-grid {
    position: absolute; inset: 0; border-radius: 50%;
    background-image:
      repeating-radial-gradient(circle at 50% 50%, hsl(40 30% 96% / 0.05) 0, hsl(40 30% 96% / 0.05) 1px, transparent 1px, transparent 33.33%);
    pointer-events: none;
  }
  .hab-line { stroke: hsl(24 100% 58% / 0.32); stroke-width: 0.6; stroke-dasharray: 3 3; }
  .hab-line-anim { animation: hab-dash 3s linear infinite; }
  @keyframes hab-dash { to { stroke-dashoffset: -12; } }
  .hab-center {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    width: 108px; height: 108px; border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, hsl(24 100% 30% / 0.9), hsl(240 12% 8%) 70%);
    border: 1px solid hsl(24 100% 58% / 0.5);
    animation: hab-center-pulse 3.2s ease-in-out infinite;
    text-align: center; padding: 8px; z-index: 2;
  }
  @keyframes hab-center-pulse {
    0%, 100% { box-shadow: 0 0 0 0 hsl(24 100% 58% / 0.4); }
    50%      { box-shadow: 0 0 42px 10px hsl(24 100% 58% / 0); }
  }
  .hab-node {
    position: absolute; transform: translate(-50%, -50%);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    width: 92px; text-align: center; z-index: 2;
  }
  .hab-node-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: hsl(240 12% 9%); border: 1px solid ${BORDER};
    display: flex; align-items: center; justify-content: center;
    transition: border-color 200ms ease, transform 200ms ease;
  }
  .hab-node:hover .hab-node-icon { border-color: hsl(24 100% 58% / 0.5); transform: translateY(-2px); }

  .hab-workflow { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; }
  .hab-workflow::-webkit-scrollbar { height: 4px; }
  .hab-workflow::-webkit-scrollbar-thumb { background: hsl(40 30% 96% / 0.12); border-radius: 4px; }
  .hab-step {
    scroll-snap-align: start; flex: 0 0 auto; display: flex; align-items: center; gap: 8px;
    background: linear-gradient(165deg, hsl(240 12% 9.5%), hsl(240 12% 7%));
    border: 1px solid hsl(40 30% 96% / 0.05); border-radius: 999px;
    box-shadow: inset 0 1px 0 hsl(40 30% 96% / 0.04);
    padding: 10px 16px; white-space: nowrap;
  }
  .hab-step-gate {
    background: linear-gradient(165deg, hsl(24 90% 14% / 0.6), hsl(24 100% 8% / 0.5));
    border-color: hsl(24 100% 58% / 0.45);
    box-shadow: inset 0 1px 0 hsl(40 30% 96% / 0.06), 0 0 0 3px hsl(24 100% 58% / 0.08);
  }
  .hab-step-arrow { flex: 0 0 auto; color: hsl(24 100% 58% / 0.4); font-size: 13px; }

  .hab-tag {
    display: inline-block; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.03em;
    color: hsl(40 20% 60%); background: hsl(40 30% 96% / 0.04); border: 1px solid hsl(40 30% 96% / 0.06);
    border-radius: 5px; padding: 2px 7px; margin: 8px 6px 0 0;
  }
  .hab-panel-featured .hab-tag { color: hsl(24 90% 70%); background: hsl(24 100% 58% / 0.08); border-color: hsl(24 100% 58% / 0.16); }

  .hab-panel { transition: transform 200ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out; }
  .hab-panel:hover { transform: translateY(-3px); box-shadow: 0 24px 56px -28px hsl(0 0% 0% / 0.6); }
  .hab-panel-featured { box-shadow: 0 0 0 1px hsl(24 100% 58% / 0.12), 0 24px 56px -20px hsl(24 100% 58% / 0.3); }
  .hab-panel-featured:hover { box-shadow: 0 0 0 1px hsl(24 100% 58% / 0.18), 0 28px 64px -20px hsl(24 100% 58% / 0.38); }

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
    .hab-center { animation: none; }
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
    <section id="agent-bureau" data-section="agent-bureau" style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>

        {/* ─────────────────────────────────────────── HERO, two columns */}
        <div className="hab-hero" style={{ marginBottom: '4rem' }}>

          {/* LEFT — headline, copy, CTAs, trust note */}
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {'// Max Agent Bureau'}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.875rem, 3.4vw, 2.75rem)', letterSpacing: '-0.03em', lineHeight: 1.15, color: 'hsl(40 30% 96%)', marginBottom: '1.25rem', maxWidth: '30rem' }}>
              {isDE
                ? <>Ein KI-Team, das Arbeit <span style={{ color: '#F97316' }}>vorbereitet, koordiniert und ausführt.</span></>
                : <>An AI team that <span style={{ color: '#F97316' }}>prepares, coordinates and executes work.</span></>}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 12% 60%)', lineHeight: 1.75, marginBottom: '2rem', maxWidth: '30rem' }}>
              {isDE
                ? 'Agent Bureau prüft Abläufe, verteilt Aufgaben, bereitet Entscheidungen vor und führt freigegebene Aktionen über Ihre Systeme hinweg aus.'
                : 'Agent Bureau audits your workflows, assigns tasks, prepares decisions, and executes approved actions across your business systems.'}
            </p>

            {/* Routing correction 2026-07-25: this homepage hero is an entry point,
                not the dedicated page — both CTAs now route to /systems/agent-bureau
                first. That page carries its own external product / contact CTA pair. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Link
                href="/systems/agent-bureau"
                className="shine"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#F97316', color: '#080808', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '8px', whiteSpace: 'nowrap' }}
              >
                {isDE ? 'System ansehen →' : 'View system →'}
              </Link>
              <Link
                href="/systems/agent-bureau"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'hsl(40 30% 96%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '8px', border: '1px solid hsl(40 30% 96% / 0.18)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}
              >
                {isDE ? 'Mehr erfahren →' : 'Learn more →'}
              </Link>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', maxWidth: '100%' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'hsl(40 20% 62%)', letterSpacing: '0.02em', lineHeight: 1.6, margin: 0 }}>
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
            <div className="hab-orbit-glow" />
            <div className="hab-orbit-grid" />

            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
              {positions.map((p, i) => (
                <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} className="hab-line hab-line-anim" />
              ))}
            </svg>

            <div className="hab-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" />
                <path d="M8.5 7.5 10.5 15.5M15.5 7.5 13.5 15.5M9 6h6" />
              </svg>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: '#FFF', letterSpacing: '0.04em', marginTop: '6px', lineHeight: 1.25 }}>
                AGENT<br />BUREAU
              </span>
            </div>

            {nodes.map((node, i) => (
              <div key={node.key} className="hab-node" style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}>
                <span className="hab-node-icon"><OrbitIcon name={node.key} /></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'hsl(40 20% 75%)', letterSpacing: '0.02em', lineHeight: 1.3 }}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─────────────────────────────────────────── WORKFLOW, compact connected strip */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 42%)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '14px' }}>
          {isDE ? 'Der Ablauf' : 'The workflow'}
        </p>
        <div className="hab-workflow" style={{ marginBottom: '3rem' }}>
          {flow.map((step, i) => (
            <div key={step.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={`hab-step${'gate' in step && step.gate ? ' hab-step-gate' : ''}`}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', color: 'hsl(40 30% 96%)', lineHeight: 1.2 }}>
                    {step.name}
                  </span>
                  <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '11px', color: 'gate' in step && step.gate ? '#F97316' : 'hsl(40 12% 50%)', lineHeight: 1.3 }}>
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
                background: group.featured
                  ? 'linear-gradient(165deg, hsl(24 55% 11% / 0.55), hsl(240 12% 7%) 60%)'
                  : 'linear-gradient(165deg, hsl(240 12% 8.5%), hsl(240 12% 6.5%))',
                border: `1px solid ${group.featured ? 'hsl(24 100% 58% / 0.35)' : 'hsl(40 30% 96% / 0.045)'}`,
                boxShadow: 'inset 0 1px 0 hsl(40 30% 96% / 0.04)',
                borderRadius: '16px',
                padding: group.featured ? '28px 24px' : '22px',
                display: 'flex', flexDirection: 'column', gap: '18px',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: group.featured ? '#F97316' : 'hsl(40 20% 70%)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                {group.title}
              </h3>
              {group.items.map((item) => (
                <div key={item.key} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: group.featured ? '38px' : '34px', height: group.featured ? '38px' : '34px',
                    borderRadius: '9px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CapabilityIcon name={item.icon} />
                  </span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: group.featured ? '15px' : '14px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.01em', margin: '0 0 3px 0', lineHeight: 1.3 }}>
                      {item.title}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'hsl(40 12% 55%)', lineHeight: 1.6, margin: 0 }}>
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
