import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Reveal } from '@/components/ui/Reveal'
import { ConnectedSystems } from '@/components/systems/ConnectedSystems'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'Max Agent Bureau | Intelligente KI-Agenten, sichere Prozesse'
    : 'Max Agent Bureau | Intelligent AI Agents, Secure Processes'
  const description = isDE
    ? 'Ein Team aus KI-Agenten übernimmt Kundenanfragen, Follow-ups, Freigaben und Berichte, jede wichtige Aktion läuft vorher über Sie.'
    : 'A team of AI agents handles customer enquiries, follow-ups, approvals and reporting, every important action still goes through you first.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/systems/agent-bureau`,
      languages: {
        de: 'https://www.maxpromo.digital/de/systems/agent-bureau',
        en: 'https://www.maxpromo.digital/en/systems/agent-bureau',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/systems/agent-bureau`,
    },
  }
}

/* ─── TOKENS ──────────────────────────────────────────────── */
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .ab-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .ab-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  .ab-flow   { display: grid; gap: 1px; background: ${BORDER}; grid-template-columns: repeat(5, 1fr); }
  .ab-modules { display: grid; gap: 12px; grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 900px) {
    .ab-flow    { grid-template-columns: repeat(2, 1fr); }
    .ab-modules { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .ab-grid-2 { grid-template-columns: 1fr; }
    .ab-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
  @media (max-width: 560px) {
    .ab-flow    { grid-template-columns: 1fr; }
    .ab-modules { grid-template-columns: 1fr; }
  }
  .ab-cta-primary   { transition: background 150ms ease; }
  .ab-cta-primary:hover   { background: #EA6A00 !important; }
  .ab-cta-secondary { transition: border-color 150ms ease; }
  .ab-cta-secondary:hover { border-color: #333 !important; }
`

/* ─── PAGE ────────────────────────────────────────────────── */

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export default async function AgentBureauPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const isDE = locale === 'de'

  const workflow = isDE
    ? [
        { name: 'Audit & Diagnose', caption: 'Abläufe scannen, Engpässe finden' },
        { name: 'Agent Team',       caption: 'Aufgaben verteilen' },
        { name: 'Review',           caption: 'Mensch gibt frei', gate: true },
        { name: 'Execute',          caption: 'Aktion ausführen' },
        { name: 'Log',              caption: 'Alles dokumentiert' },
      ]
    : [
        { name: 'Audit & Diagnose', caption: 'Scan workflows, find bottlenecks' },
        { name: 'Agent Team',       caption: 'Assign tasks' },
        { name: 'Review',           caption: 'Human approves', gate: true },
        { name: 'Execute',          caption: 'Run the action' },
        { name: 'Log',              caption: 'Everything logged' },
      ]

  const modules = isDE
    ? [
        { key: 'audit',    title: 'AI Audit Console',      body: 'Findet Engpässe, Risiken und Automatisierungschancen.' },
        { key: 'waiting',  title: 'Customer Waiting Room', body: 'Sammelt Anfragen, ordnet Prioritäten und hält Kunden sichtbar.' },
        { key: 'approval', title: 'Approval Desk',         body: 'Entscheidungen bleiben kontrolliert, dokumentiert und freigabepflichtig.' },
        { key: 'intake',   title: 'Document Intake Desk',  body: 'Sortiert Dokumente, erkennt Lücken und bereitet Pakete vor.' },
        { key: 'shadow',   title: 'Shadow AI Governance',  body: 'Zeigt, wo KI im Betrieb genutzt wird und wo Kontrolle fehlt.' },
      ]
    : [
        { key: 'audit',    title: 'AI Audit Console',      body: 'Identifies bottlenecks, risks, and automation opportunities.' },
        { key: 'waiting',  title: 'Customer Waiting Room', body: 'Collects requests, ranks priorities, keeps clients visible.' },
        { key: 'approval', title: 'Approval Desk',         body: 'Decisions stay controlled, documented, and approval-gated.' },
        { key: 'intake',   title: 'Document Intake Desk',  body: 'Sorts documents, spots gaps, and prepares delivery packages.' },
        { key: 'shadow',   title: 'Shadow AI Governance',  body: 'Shows where AI is used in the business and where control is missing.' },
      ]

  const faq = isDE
    ? [
        { q: 'Handeln die Agenten selbstständig?', a: 'Nein. Jede kritische Aktion, E-Mail-Versand, Angebot, Rechnung, Kundenantwort, bleibt freigabepflichtig. Agenten bereiten vor, ein Mensch entscheidet.' },
        { q: 'Ersetzt das mein Team?',              a: 'Nein. Es übernimmt die repetitive Vorbereitung, damit Ihr Team sich auf Entscheidungen und Kundenbeziehungen konzentrieren kann.' },
        { q: 'Kann ich sehen, was die Agenten tun?', a: 'Ja. Jede Aktion wird protokolliert, mit Zeitstempel, Freigeber und Ergebnis.' },
        { q: 'Für welche Aufgaben ist das gebaut?',  a: 'Kundenanfragen, E-Mail-Triage, Follow-ups, Terminkoordination, Dokumentenvorbereitung, Berichte und interne Benachrichtigungen.' },
      ]
    : [
        { q: 'Do the agents act on their own?', a: 'No. Every critical action, sending an email, a quote, an invoice, a customer reply, requires human approval first. Agents prepare, a person decides.' },
        { q: 'Does this replace my team?',       a: 'No. It takes over repetitive preparation work so your team can focus on decisions and customer relationships.' },
        { q: 'Can I see what the agents are doing?', a: 'Yes. Every action is logged, with a timestamp, who approved it, and the outcome.' },
        { q: 'What tasks is this built for?',   a: 'Customer enquiry handling, email triage, follow-ups, appointment coordination, document preparation, reporting and internal notifications.' },
      ]

  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* 1. HERO */}
        <section style={{ padding: '5rem 2rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="ab-hero">
            <div>
              <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
                {isDE ? 'MAX AGENT BUREAU · KI-BÜRO' : 'MAX AGENT BUREAU · AI OFFICE'}
              </p>
              <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
                {isDE ? <>Intelligente KI-Agenten.<br />Sichere Prozesse.</> : <>Intelligent AI agents.<br />Secure processes.</>}
              </h1>
              <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
                {isDE
                  ? 'Ein Team aus KI-Agenten übernimmt Kundenanfragen, Follow-ups, Freigaben und Berichte für Ihr Unternehmen, jede wichtige Aktion läuft vorher über Sie.'
                  : 'A team of AI agents handles customer enquiries, follow-ups, approvals and reporting for your business, every important action still goes through you first.'}
              </p>
              <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
                {(isDE
                  ? ['Wir automatisieren die Routinearbeit', 'Sie geben die Entscheidungen frei', 'Keine autonome Ausführung', 'Jede Aktion protokolliert']
                  : ['We automate the busywork', 'You approve the decisions', 'No autonomous execution', 'Every action logged']
                ).map(p => (
                  <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <a href="https://agents.maxpromo.digital" target="_blank" rel="noopener noreferrer" className="ab-cta-primary"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }}
                  >{isDE ? 'System ansehen →' : 'View system →'}</a>
                <Link href="/contact?system=agent-bureau" className="ab-cta-secondary"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}
                  >{isDE ? 'Demo anfragen →' : 'Request demo →'}</Link>
              </div>
            </div>

            {/* Diagram-style hero visual, no product screenshot exists yet for this system */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '2rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#444', marginBottom: '1.25rem' }}>
                {isDE ? 'DER ABLAUF' : 'THE WORKFLOW'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {workflow.map((step, i) => (
                  <div key={step.name} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: step.gate ? 'rgba(249,115,22,0.07)' : '#141414', border: `1px solid ${step.gate ? 'rgba(249,115,22,0.25)' : BORDER}`, borderRadius: '8px', padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: ORANGE, background: 'rgba(249,115,22,0.1)', borderRadius: '4px', padding: '3px 8px', flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', color: '#F0F0F0', margin: 0 }}>{step.name}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: step.gate ? ORANGE : '#666', margin: 0 }}>{step.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. THIS KEEPS HAPPENING */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{isDE ? 'DAS PASSIERT IMMER WIEDER' : 'THIS KEEPS HAPPENING'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{isDE ? 'Dieselbe Vorbereitung. Jede Woche.' : 'The same preparation work. Every week.'}</h2>
            <div className="ab-grid-2">
              {(isDE ? [
                { label: 'JEDE ANFRAGE VON HAND SORTIERT', text: 'Kundenanfragen kommen per E-Mail, WhatsApp und Telefon an. Jede wird einzeln gelesen, priorisiert und beantwortet. Nichts davon ist Entscheidungsarbeit, es ist Sortierarbeit.' },
                { label: 'DIE EIGENEN FOLLOW-UPS NACHGEJAGT', text: 'Ein Angebot wurde vor zwei Wochen versendet. Niemand hat nachgefasst. Der Auftrag ist inzwischen an jemand anderen gegangen. Follow-ups passieren, wenn jemand sich erinnert.' },
                { label: 'DERSELBE BERICHT JEDE WOCHE', text: 'Zahlen werden aus drei verschiedenen Systemen zusammengetragen. Der Bericht sieht jede Woche fast gleich aus. Das Zusammentragen dauert länger als das eigentliche Lesen.' },
              ] : [
                { label: 'EVERY ENQUIRY SORTED BY HAND', text: 'Customer enquiries arrive by email, WhatsApp and phone. Each one is read, prioritised and answered individually. None of it is decision work, it is sorting work.' },
                { label: 'CHASING YOUR OWN FOLLOW-UPS', text: 'A quote went out two weeks ago. Nobody followed up. The job has since gone to someone else. Follow-ups happen when somebody remembers.' },
                { label: 'THE SAME REPORT EVERY WEEK', text: 'Numbers get pulled together from three different systems. The report looks almost the same every week. Compiling it takes longer than reading it.' },
              ]).map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${ORANGE}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. SYSTEM INSTALLED */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>{isDE ? 'SYSTEM INSTALLIERT' : 'SYSTEM INSTALLED'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.2, marginBottom: '1.5rem' }}>
                  {isDE ? 'Agent Bureau wird in das Unternehmen installiert. Die Vorbereitungsarbeit läuft im Hintergrund.' : 'Agent Bureau is installed into the business. The preparation work runs in the background.'}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  {isDE
                    ? 'Agenten scannen die aktuell laufenden Abläufe, per E-Mail, WhatsApp, Tabellen und manuellen Schritten, und ordnen Aufgaben spezialisierten Agenten zu, Anfragenbearbeitung, Follow-ups, Dokumentenvorbereitung, Berichte.'
                    : 'Agents scan the business workflows currently running by email, WhatsApp, spreadsheets and manual steps, and assign tasks to specialised agents, enquiry handling, follow-ups, document prep, reporting.'}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginTop: '1rem' }}>
                  {isDE
                    ? 'Jede kritische Aktion wird zur Freigabe vorgelegt, bevor sie ausgeführt wird. Keine autonome Ausführung. Erst nach Freigabe laufen Antworten, Aktualisierungen und Aufgaben.'
                    : 'Every critical action is queued for human approval before it goes out. No autonomous execution. Only after approval do replies, updates and tasks run.'}
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${ORANGE}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{isDE ? 'WAS DIE AGENTEN ÜBERNEHMEN' : 'WHAT THE AGENTS TAKE OVER'}</p>
                {(isDE
                  ? ['Anfragen sortiert, priorisiert, vorbereitet zur Beantwortung', 'Follow-ups ausgelöst, bevor ein Auftrag kalt wird', 'Dokumente vorbereitet und Lücken markiert', 'Berichte zusammengestellt, aus allen Quellen', 'Jede Aktion protokolliert, mit Zeitstempel und Freigeber']
                  : ['Enquiries sorted, prioritised, prepared for reply', 'Follow-ups triggered before a lead goes cold', 'Documents prepared and gaps flagged', 'Reports compiled, from every source', 'Every action logged, with timestamp and approver']
                ).map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.65 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. WORKFLOW */}
        <section id="workflow" style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{isDE ? 'WIE DAS SYSTEM FUNKTIONIERT' : 'HOW THE SYSTEM WORKS'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>{isDE ? 'Fünf Schritte. Jede kritische Aktion braucht eine Freigabe.' : 'Five steps. Every critical action needs a sign-off.'}</h2>
            <Reveal>
              <div className="ab-flow" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                {workflow.map((step, i) => (
                  <div key={step.name} style={{ background: step.gate ? 'rgba(249,115,22,0.07)' : '#141414', padding: '1.5rem 1.25rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: ORANGE, background: 'rgba(249,115,22,0.1)', border: `1px solid rgba(249,115,22,0.2)`, borderRadius: '4px', padding: '3px 8px' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {step.gate && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      )}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', color: '#F0F0F0', letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>{step.name}</h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: step.gate ? ORANGE : '#666', lineHeight: 1.55, margin: 0 }}>{step.caption}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Module cards */}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#444', margin: '3rem 0 1.25rem' }}>{isDE ? 'DIE MODULE' : 'THE MODULES'}</p>
            <div className="ab-modules">
              {modules.map(card => (
                <div key={card.title} style={{ background: '#141414', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', color: '#F0F0F0', letterSpacing: '-0.02em', margin: 0 }}>{card.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#666666', lineHeight: 1.7, margin: 0 }}>{card.body}</p>
                </div>
              ))}
            </div>

            {/* Trust badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(249,115,22,0.05)', border: `1px solid rgba(249,115,22,0.18)`, borderRadius: '10px', padding: '14px 20px', marginTop: '2.5rem', maxWidth: '100%' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ccc', letterSpacing: '0.03em', lineHeight: 1.6, margin: 0 }}>
                {isDE ? 'Keine autonome Ausführung. Jede kritische Aktion bleibt freigabepflichtig.' : 'No autonomous execution. Every critical action requires human approval.'}
              </p>
            </div>
          </div>
        </section>

        {/* 5. WHAT CHANGES */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{isDE ? 'WAS SICH NACH DER INSTALLATION ÄNDERT' : 'WHAT CHANGES AFTER INSTALLATION'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>{isDE ? 'Das Team trifft dieselben Entscheidungen. Es bereitet sie nicht mehr selbst vor.' : 'The team makes the same decisions. It no longer prepares them alone.'}</h2>
            <div style={{ background: BORDER, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{isDE ? 'VORHER' : 'BEFORE'}</p></div>
                <div style={{ padding: '14px 28px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{isDE ? 'NACHHER' : 'AFTER'}</p></div>
              </div>
              {(isDE ? [
                { before: 'Jede Anfrage einzeln von Hand sortiert', after: 'Anfragen vorsortiert, priorisiert, vorbereitet zur Beantwortung' },
                { before: 'Follow-ups passieren, wenn jemand sich erinnert', after: 'Follow-ups automatisch ausgelöst, zur Freigabe vorgelegt' },
                { before: 'Bericht wird jede Woche neu zusammengetragen', after: 'Bericht automatisch zusammengestellt, aus allen Quellen' },
                { before: 'Keine Übersicht, wo KI im Betrieb bereits läuft', after: 'Vollständiges Protokoll, jede Aktion mit Zeitstempel und Freigeber' },
              ] : [
                { before: 'Every enquiry sorted by hand, one at a time', after: 'Enquiries pre-sorted, prioritised, prepared for reply' },
                { before: 'Follow-ups happen when somebody remembers', after: 'Follow-ups triggered automatically, queued for approval' },
                { before: 'Report rebuilt from scratch every week', after: 'Report compiled automatically, from every source' },
                { before: 'No visibility into where AI already runs in the business', after: 'Full log, every action with timestamp and approver' },
              ]).map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                  <div style={{ padding: '18px 28px', borderRight: `1px solid ${BORDER}`, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#444', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>✕</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#555', margin: 0, lineHeight: 1.6 }}>{row.before}</p>
                  </div>
                  <div style={{ padding: '18px 28px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>✓</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F0F0F0', margin: 0, lineHeight: 1.6 }}>{row.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ConnectedSystems systems={[
          { slug: 'taxkontrol',    name: 'TaxKontrol',    description: isDE ? 'Finanzielle Übersicht, täglich sichtbar.' : 'Financial visibility, visible every day.', href: '/systems/taxkontrol' },
          { slug: 'handwerk-os',   name: 'HandwerkOS',    description: isDE ? 'Aufträge und Rechnungen automatisiert.' : 'Jobs and invoices automated.', href: '/systems/handwerk-os' },
          { slug: 'restaurant-os', name: 'RestaurantOS',  description: isDE ? 'Bestellungen und Service automatisiert.' : 'Orders and service automated.', href: '/systems/restaurant-os' },
        ]} locale={locale} />

        {/* 6. FAQ */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '2rem' }}>{isDE ? 'HÄUFIG GEFRAGT' : 'COMMONLY ASKED'}</p>
            <div className="ab-grid-2">
              {faq.map(item => (
                <div key={item.q} style={{ background: '#141414', padding: '32px' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '10px' }}>{item.q}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. CTA */}
        <section style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{isDE ? 'DEMO ANFRAGEN' : 'REQUEST A DEMO'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>{isDE ? 'Sehen Sie Agent Bureau live, für Ihr Unternehmen.' : 'See how Agent Bureau prepares work for your business.'}</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px', marginBottom: '2.5rem' }}>
              {isDE
                ? 'Wir zeigen das Live-System, Anfragenbearbeitung, Follow-ups, Freigabeprozess und Protokollierung, konfiguriert für Ihre bestehenden Abläufe.'
                : 'We walk through the live system, enquiry handling, follow-ups, the approval process and logging, configured for your existing workflows.'}
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="https://agents.maxpromo.digital" target="_blank" rel="noopener noreferrer" className="ab-cta-primary"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }}
                >{isDE ? 'System ansehen →' : 'View system →'}</a>
              <Link href="/contact?system=agent-bureau" className="ab-cta-secondary"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}
                >{isDE ? 'Demo anfragen →' : 'Request demo →'}</Link>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '20px 0 0' }}>
              {isDE ? '// Unverbindlich · Antwort innerhalb von 24 Stunden' : '// No commitment · Reply within 24 hours'}
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
