import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@maxpromo/ui'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'Max Agent Bureau'
    : 'Max Agent Bureau'
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

/* ─── TOKENS ─── Visual Facelift v2.1 (design/visual-facelift-v2.1.md) */
const BG      = 'var(--brand-background)'
const SECTION = 'var(--brand-surface-subtle)'
const BORDER  = 'var(--brand-border)'
const TEXT    = 'var(--brand-text)'
const MUTED   = 'var(--brand-text-secondary)'

const STYLES = `
  .ab-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; border: 1px solid ${BORDER}; }
  .ab-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-10); align-items: center; }
  .ab-flow   { display: grid; gap: 1px; background: ${BORDER}; grid-template-columns: repeat(5, 1fr); border: 1px solid ${BORDER}; }
  .ab-modules { display: grid; gap: var(--space-4); grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 900px) {
    .ab-flow    { grid-template-columns: repeat(2, 1fr); }
    .ab-modules { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .ab-grid-2 { grid-template-columns: 1fr; }
    .ab-hero   { grid-template-columns: 1fr; gap: var(--space-6); }
  }
  @media (max-width: 560px) {
    .ab-flow    { grid-template-columns: 1fr; }
    .ab-modules { grid-template-columns: 1fr; }
  }
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

  const SECTION_PADDING = 'var(--section-y) var(--section-x)'

  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* 1. HERO */}
        <section style={{ padding: SECTION_PADDING, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }} className="ab-hero">
            <div>
              <p className="mp-hero-1" style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: 'var(--space-5)' }}>
                {isDE ? 'MAX AGENT BUREAU · KI-BÜRO' : 'MAX AGENT BUREAU · AI OFFICE'}
              </p>
              <h1 className="mp-hero-2" style={{ marginBottom: 'var(--space-5)', maxWidth: '760px' }}>
                {isDE ? <>Intelligente KI-Agenten.<br />Sichere Prozesse.</> : <>Intelligent AI agents.<br />Secure processes.</>}
              </h1>
              <p className="mp-hero-3" style={{ fontFamily: 'var(--brand-font-body)', fontSize: '18px', color: MUTED, maxWidth: '580px', lineHeight: 1.75, marginBottom: '2.5rem' }}>
                {isDE
                  ? 'Ein Team aus KI-Agenten übernimmt Kundenanfragen, Follow-ups, Freigaben und Berichte für Ihr Unternehmen, jede wichtige Aktion läuft vorher über Sie.'
                  : 'A team of AI agents handles customer enquiries, follow-ups, approvals and reporting for your business, every important action still goes through you first.'}
              </p>
              <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: '2.5rem' }}>
                {(isDE
                  ? ['Wir automatisieren die Routinearbeit', 'Sie geben die Entscheidungen frei', 'Keine autonome Ausführung', 'Jede Aktion protokolliert']
                  : ['We automate the busywork', 'You approve the decisions', 'No autonomous execution', 'Every action logged']
                ).map(p => (
                  <span key={p} style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: TEXT, background: SECTION, border: `1px solid ${BORDER}`, padding: '6px 14px', borderRadius: 'var(--radius-md)', letterSpacing: '0.03em' }}>→ {p}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
                <a href="https://agents.maxpromo.digital" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  {isDE ? 'System ansehen →' : 'View system →'}
                </a>
                <Link href="/contact?system=agent-bureau" className="btn btn-secondary">
                  {isDE ? 'Demo anfragen →' : 'Request demo →'}
                </Link>
              </div>
            </div>

            {/* Workflow diagram — informational, not decorative: shows the actual
                audit → assign → approve → execute → log pipeline */}
            <div className="card">
              <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: '1.25rem' }}>
                {isDE ? 'DER ABLAUF' : 'THE WORKFLOW'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {workflow.map((step, i) => (
                  <div key={step.name} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: step.gate ? 'color-mix(in srgb, var(--brand-primary) 7%, transparent)' : SECTION, border: `1px solid ${step.gate ? 'color-mix(in srgb, var(--brand-primary) 25%, transparent)' : BORDER}`, borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--brand-primary-text)', background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', borderRadius: 'var(--radius-sm)', padding: '3px 8px', flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p style={{ fontFamily: 'var(--brand-font-heading)', fontWeight: 'var(--weight-heading)', fontSize: '14px', color: TEXT, margin: 0 }}>{step.name}</p>
                      <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-micro)', color: step.gate ? 'var(--brand-primary-text)' : MUTED, margin: 0 }}>{step.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. THIS KEEPS HAPPENING */}
        <section style={{ background: SECTION, borderBottom: `1px solid ${BORDER}`, padding: SECTION_PADDING }}>
          <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: 'var(--space-4)' }}>{isDE ? 'DAS PASSIERT IMMER WIEDER' : 'THIS KEEPS HAPPENING'}</p>
            <h2 style={{ marginBottom: '2.5rem' }}>{isDE ? 'Dieselbe Vorbereitung. Jede Woche.' : 'The same preparation work. Every week.'}</h2>
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
                <div key={item.label} style={{ background: BG, padding: '36px', borderTop: `3px solid var(--brand-primary-edge)` }}>
                  <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 var(--space-4)' }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: '16px', color: MUTED, lineHeight: 1.75, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. SYSTEM INSTALLED */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: SECTION_PADDING }}>
          <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: 'var(--space-5)' }}>{isDE ? 'SYSTEM INSTALLIERT' : 'SYSTEM INSTALLED'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-10)', alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-2">
              <div>
                <h2 style={{ marginBottom: 'var(--space-5)' }}>
                  {isDE ? 'Agent Bureau wird in das Unternehmen installiert. Die Vorbereitungsarbeit läuft im Hintergrund.' : 'Agent Bureau is installed into the business. The preparation work runs in the background.'}
                </h2>
                <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-body)', color: MUTED, lineHeight: 1.75 }}>
                  {isDE
                    ? 'Agenten scannen die aktuell laufenden Abläufe, per E-Mail, WhatsApp, Tabellen und manuellen Schritten, und ordnen Aufgaben spezialisierten Agenten zu, Anfragenbearbeitung, Follow-ups, Dokumentenvorbereitung, Berichte.'
                    : 'Agents scan the business workflows currently running by email, WhatsApp, spreadsheets and manual steps, and assign tasks to specialised agents, enquiry handling, follow-ups, document prep, reporting.'}
                </p>
                <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-body)', color: MUTED, lineHeight: 1.75, marginTop: 'var(--space-4)' }}>
                  {isDE
                    ? 'Jede kritische Aktion wird zur Freigabe vorgelegt, bevor sie ausgeführt wird. Keine autonome Ausführung. Erst nach Freigabe laufen Antworten, Aktualisierungen und Aufgaben.'
                    : 'Every critical action is queued for human approval before it goes out. No autonomous execution. Only after approval do replies, updates and tasks run.'}
                </p>
              </div>
              <div style={{ borderLeft: `3px solid var(--brand-primary-edge)`, paddingLeft: 'var(--space-6)' }}>
                <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'var(--space-5)' }}>{isDE ? 'WAS DIE AGENTEN ÜBERNEHMEN' : 'WHAT THE AGENTS TAKE OVER'}</p>
                {(isDE
                  ? ['Anfragen sortiert, priorisiert, vorbereitet zur Beantwortung', 'Follow-ups ausgelöst, bevor ein Auftrag kalt wird', 'Dokumente vorbereitet und Lücken markiert', 'Berichte zusammengestellt, aus allen Quellen', 'Jede Aktion protokolliert, mit Zeitstempel und Freigeber']
                  : ['Enquiries sorted, prioritised, prepared for reply', 'Follow-ups triggered before a lead goes cold', 'Documents prepared and gaps flagged', 'Reports compiled, from every source', 'Every action logged, with timestamp and approver']
                ).map(line => (
                  <div key={line} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--brand-primary-text)', flexShrink: 0, fontFamily: 'var(--brand-font-mono)', fontSize: '12px', paddingTop: '2px', fontWeight: 700 }}>→</span>
                    <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: MUTED, margin: 0, lineHeight: 1.65 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. WORKFLOW */}
        <section id="workflow" style={{ background: SECTION, borderBottom: `1px solid ${BORDER}`, padding: SECTION_PADDING }}>
          <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: 'var(--space-4)' }}>{isDE ? 'WIE DAS SYSTEM FUNKTIONIERT' : 'HOW THE SYSTEM WORKS'}</p>
            <h2 style={{ marginBottom: 'var(--space-8)' }}>{isDE ? 'Fünf Schritte. Jede kritische Aktion braucht eine Freigabe.' : 'Five steps. Every critical action needs a sign-off.'}</h2>
            <Reveal>
              <div className="ab-flow" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {workflow.map((step, i) => (
                  <div key={step.name} style={{ background: step.gate ? 'color-mix(in srgb, var(--brand-primary) 7%, transparent)' : BG, padding: '1.5rem 1.25rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--brand-primary-text)', background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)', borderRadius: 'var(--radius-sm)', padding: '3px 8px' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {step.gate && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      )}
                    </div>
                    <h3 className="h-card" style={{ margin: '0 0 var(--space-1) 0' }}>{step.name}</h3>
                    <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-micro)', color: step.gate ? 'var(--brand-primary-text)' : MUTED, lineHeight: 1.55, margin: 0 }}>{step.caption}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Module cards */}
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, margin: '3rem 0 1.25rem' }}>{isDE ? 'DIE MODULE' : 'THE MODULES'}</p>
            <div className="ab-modules">
              {modules.map(card => (
                <div key={card.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 className="h-card" style={{ margin: 0 }}>{card.title}</h3>
                  <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: MUTED, lineHeight: 1.7, margin: 0 }}>{card.body}</p>
                </div>
              ))}
            </div>

            {/* Trust badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', background: 'color-mix(in srgb, var(--brand-primary) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 18%, transparent)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginTop: '2.5rem', maxWidth: '100%' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-micro)', color: MUTED, letterSpacing: '0.02em', lineHeight: 1.6, margin: 0 }}>
                {isDE ? 'Keine autonome Ausführung. Jede kritische Aktion bleibt freigabepflichtig.' : 'No autonomous execution. Every critical action requires human approval.'}
              </p>
            </div>
          </div>
        </section>

        {/* 5. WHAT CHANGES */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: SECTION_PADDING }}>
          <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: 'var(--space-4)' }}>{isDE ? 'WAS SICH NACH DER INSTALLATION ÄNDERT' : 'WHAT CHANGES AFTER INSTALLATION'}</p>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>{isDE ? 'Das Team trifft dieselben Entscheidungen. Es bereitet sie nicht mehr selbst vor.' : 'The team makes the same decisions. It no longer prepares them alone.'}</h2>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1px', background: BORDER }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: BG }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}><p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-label)', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>{isDE ? 'VORHER' : 'BEFORE'}</p></div>
                <div style={{ padding: '14px 28px' }}><p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-label)', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>{isDE ? 'NACHHER' : 'AFTER'}</p></div>
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
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: BG }}>
                  <div style={{ padding: '18px 28px', borderRight: `1px solid ${BORDER}`, display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                    <span style={{ color: MUTED, flexShrink: 0, fontFamily: 'var(--brand-font-mono)', fontSize: '12px', paddingTop: '2px' }}><Icon name="cross" size="sm" /></span>
                    <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: MUTED, margin: 0, lineHeight: 1.6 }}>{row.before}</p>
                  </div>
                  <div style={{ padding: '18px 28px', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--brand-primary-text)', flexShrink: 0, fontFamily: 'var(--brand-font-mono)', fontSize: '12px', paddingTop: '2px', fontWeight: 700 }}><Icon name="check" size="sm" /></span>
                    <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: TEXT, margin: 0, lineHeight: 1.6 }}>{row.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section style={{ background: SECTION, borderBottom: `1px solid ${BORDER}`, padding: SECTION_PADDING }}>
          <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: 'var(--space-6)' }}>{isDE ? 'HÄUFIG GEFRAGT' : 'COMMONLY ASKED'}</p>
            <div className="ab-grid-2">
              {faq.map(item => (
                <div key={item.q} style={{ background: BG, padding: 'var(--space-6)' }}>
                  <h3 className="h-card" style={{ marginBottom: '10px' }}>{item.q}</h3>
                  <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: MUTED, lineHeight: 1.75, margin: 0 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. CTA */}
        <section style={{ background: BG, padding: SECTION_PADDING }}>
          <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: 'var(--space-4)' }}>{isDE ? 'DEMO ANFRAGEN' : 'REQUEST A DEMO'}</p>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>{isDE ? 'Sehen Sie Agent Bureau live, für Ihr Unternehmen.' : 'See how Agent Bureau prepares work for your business.'}</h2>
            <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: '18px', color: MUTED, lineHeight: 1.75, maxWidth: '520px', marginBottom: '2.5rem' }}>
              {isDE
                ? 'Wir zeigen das Live-System, Anfragenbearbeitung, Follow-ups, Freigabeprozess und Protokollierung, konfiguriert für Ihre bestehenden Abläufe.'
                : 'We walk through the live system, enquiry handling, follow-ups, the approval process and logging, configured for your existing workflows.'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="https://agents.maxpromo.digital" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                {isDE ? 'System ansehen →' : 'View system →'}
              </a>
              <Link href="/contact?system=agent-bureau" className="btn btn-secondary">
                {isDE ? 'Demo anfragen →' : 'Request demo →'}
              </Link>
            </div>
            <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: MUTED, letterSpacing: '0.05em', margin: '20px 0 0' }}>
              {isDE ? 'Unverbindlich · Antwort innerhalb von 24 Stunden' : 'No commitment · Reply within 24 hours'}
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
