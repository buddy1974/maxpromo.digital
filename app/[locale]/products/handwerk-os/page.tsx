import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Reveal } from '@/components/ui/Reveal'
import { ConnectedSystems } from '@/components/systems/ConnectedSystems'
import { HandwerkContactForm } from './HandwerkContactForm'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'HandwerkOS | Auftragserfassung, Angebote & XRechnung'
    : 'HandwerkOS | Job Records, Quotes & XRechnung Invoicing'
  const description = isDE
    ? 'Digitale Auftragserfassung, automatische Angebote und XRechnung direkt aus dem Auftrag, Schluss mit der Papiernacharbeit nach jedem Einsatz.'
    : 'Digital job records, generated quotes and XRechnung invoicing straight from the job, stop re-entering paperwork after every site visit.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/products/handwerk-os`,
      languages: {
        de: 'https://www.maxpromo.digital/de/products/handwerk-os',
        en: 'https://www.maxpromo.digital/en/products/handwerk-os',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/products/handwerk-os`,
    },
  }
}

/* ─── TOKENS ──────────────────────────────────────────────── */
const GREEN  = '#22C55E'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .hw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .hw-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  .hw-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .hw-grid-2 { grid-template-columns: 1fr; }
    .hw-flow   { flex-direction: column; }
    .hw-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
`

/* ─── PAGE ────────────────────────────────────────────────── */

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export default async function HandwerkOSPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* 1. HERO */}
        <section style={{ padding: '5rem 2rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="hw-hero">
          <div>
            <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>{locale === 'de' ? 'FELDBETRIEB-SYSTEM' : 'FIELD OPERATIONS SYSTEM'}</p>
            <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              {locale === 'de' ? <>Schluss mit der Papiernacharbeit<br />nach jedem Einsatz.</> : <>Stop re-entering paperwork<br />after every site visit.</>}
            </h1>
            <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              {locale === 'de' ? 'Digitale Auftragserfassung. Automatische Angebote. XRechnung direkt aus dem Auftrag.' : 'HandwerkOS keeps jobs, quotes, time tracking and invoices connected from the first site visit to the paid invoice, without changing how the team already works on site.'}
            </p>
            <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {(locale === 'de' ? ['Foto zu Auftrag in 10 Sekunden', 'Angebote mit Marktpreisen erstellt', 'GPS-Zeiterfassung ab Check-in', 'XRechnung XML auf jeder Rechnung'] : ['Photo to job record in 10 seconds', 'Quotes generated with market rates', 'GPS time tracking from check-in', 'XRechnung XML on every invoice']).map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="#walkthrough" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
                onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}>{locale === 'de' ? 'Walkthrough planen →' : 'Schedule walkthrough →'}</a>
              <Link href="/contact?system=handwerk-os&request=walkthrough"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#333')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>{locale === 'de' ? 'Walkthrough anfragen →' : 'Request a Walkthrough →'}</Link>
            </div>
          </div>
          <div className="mp-img-wrap mp-hero-2" style={{ borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}>
            <Image
              src={locale === 'de' ? '/images/systems/handwerk-os/card/handwerk-os-de.png' : '/images/systems/handwerk-os/card/handwerk-os-en.png'}
              alt={locale === 'de' ? 'Handwerker auf der Baustelle, Auftragszettel fotografiert für sofortige Datensatzerstellung' : 'Field worker on construction site, job sheet photographed for instant record creation'}
              width={760}
              height={400}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              priority
            />
          </div>
          </div>
        </section>

        {/* 2. THIS KEEPS HAPPENING */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'DAS PASSIERT IMMER WIEDER' : 'THIS KEEPS HAPPENING'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Dieselbe Reibung. Nach jedem Auftrag.' : 'The same friction. After every job.'}</h2>
            <div className="hw-grid-2">
              {(locale === 'de' ? [
                { label: 'DOPPELTE ERFASSUNG', text: 'Der Auftrag ist erledigt. Notizen auf Papier. Zurück im Büro wird dieselbe Information ins System getippt, wenn das Papier noch lesbar ist und wenn Zeit vor dem nächsten Auftrag bleibt.' },
                { label: 'DIE ANGEBOTSVERZÖGERUNG', text: 'Der Kunde möchte ein Angebot. Der Preis kommt aus dem Gedächtnis oder aus einer Preisliste irgendwo in einem Ordner. Das Angebot wird drei Tage später gesendet. Der Kunde hat bereits jemanden anderen angerufen.' },
                { label: 'ZEIT NICHT ERFASST', text: 'Der Techniker ist vier Stunden auf der Baustelle. Die Zeit wird nicht formal erfasst. Die Rechnung wird am Monatsende geschätzt. Die Schätzung ist meist konservativ. Das ist die Marge, die verschwindet.' },
                { label: 'XRECHNUNG PER HAND', text: 'Die Rechnung ist fertig. Der öffentliche Auftraggeber benötigt XRechnung XML. Jemand öffnet erneut die Dokumentation. Das XML wird manuell erstellt. Eine Stunde Verwaltung für ein Standarddokument.' },
              ] : [
                { label: 'DOUBLE ENTRY', text: "Job is done on site. Notes written on paper. Back at the office, the same information is typed into the system, if the paper can still be read, and if there is time before the next job." },
                { label: 'THE QUOTE DELAY', text: "Customer wants a quote. Price comes from memory or a rate card that lives in a folder somewhere. Quote is sent three days later. The customer has already called someone else." },
                { label: 'TIME NOT TRACKED', text: "Technician is on site for four hours. Time is not formally recorded. Invoice is estimated at the end of the month. Estimate is usually conservative. That is the margin that disappears." },
                { label: 'XRECHNUNG BY HAND', text: "Invoice is ready. Public sector client needs XRechnung XML. Someone opens the documentation again. The XML is built manually. An hour of administration for a standard deliverable." },
              ]).map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${GREEN}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. OPERATIONAL CHAOS */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE EIN AUFTRAG DERZEIT LÄUFT' : 'HOW A JOB MOVES RIGHT NOW'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Jede Neueingabe ist ein Ort, an dem Zeit verloren geht und Informationen sich ändern können.' : 'Every re-entry is a place where time is spent and information can change.'}</h2>
            <div className="hw-flow">
              {(locale === 'de' ? [
                { step: '01', label: 'Einsatz vor Ort', note: 'Auftragszettel auf Papier ausgefüllt' },
                { step: '02', label: 'Büro-Erfassung', note: 'Dieselben Daten erneut getippt' },
                { step: '03', label: 'Angebotsanfrage', note: 'Preise aus dem Gedächtnis' },
                { step: '04', label: 'Disposition', note: 'Kein GPS-Tracking aktiv' },
                { step: '05', label: 'Rechnung', note: 'XRechnung manuell erstellt' },
              ] : [
                { step: '01', label: 'Site visit', note: 'Paper job sheet filled' },
                { step: '02', label: 'Office entry', note: 'Same data typed again' },
                { step: '03', label: 'Quote request', note: 'Pricing from memory' },
                { step: '04', label: 'Dispatch', note: 'No GPS tracking active' },
                { step: '05', label: 'Invoice', note: 'XRechnung built manually' },
              ]).map(item => (
                <div key={item.step} style={{ background: '#141414', padding: '28px 24px', flex: 1, minWidth: '140px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, margin: '0 0 8px', letterSpacing: '0.1em' }}>{item.step}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F0F0F0', margin: '0 0 6px', lineHeight: 1.4, fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', margin: 0, letterSpacing: '0.05em' }}>{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. SYSTEM INSTALLED */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>{locale === 'de' ? 'SYSTEM INSTALLIERT' : 'SYSTEM INSTALLED'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.2, marginBottom: '1.5rem' }}>
                  {locale === 'de' ? 'Sie fotografieren den Auftragszettel. Zehn Sekunden später existiert der Datensatz.' : 'You photograph the job sheet. Ten seconds later, the record exists.'}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  {locale === 'de' ? 'KI liest das Auftragszettel-Foto und erstellt den vollständigen Datensatz, Kunde, Umfang, Notizen, Standort. Angebot wird aus aktuellen Marktpreisen generiert. PDF direkt an den Kunden gesendet. Techniker disponiert. GPS-Check-in startet die Zeiterfassung.' : 'AI reads the job sheet image and creates the full record, client, scope, notes, location. Quote is generated from current market rates. PDF sent to the client directly. Technician dispatched. GPS check-in starts time tracking.'}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginTop: '1rem' }}>
                  {locale === 'de' ? 'Wenn der Auftrag akzeptiert wird, wandelt ein Klick das Angebot in eine Rechnung um. XRechnung XML automatisch angehängt.' : 'When the job is accepted, one click converts the quote to an invoice. XRechnung XML attached automatically.'}
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${GREEN}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{locale === 'de' ? 'WAS AUTOMATISCH LÄUFT' : 'WHAT RUNS AUTOMATICALLY'}</p>
                {(locale === 'de' ? ['Auftragszettel zu Datensatz, in unter 10 Sekunden', 'Angebot zu Marktpreisen, erstellt und gesendet', 'GPS-Zeiterfassung, von Check-in bis Check-out', 'Rechnung aus akzeptiertem Angebot, ein Klick', 'XRechnung XML, automatisch angehängt'] : ['Job record from photo, in under 10 seconds', 'Quote at market rates, generated and sent', 'GPS time tracking, from check-in to check-out', 'Invoice from accepted quote, one click', 'XRechnung XML, attached automatically']).map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: GREEN, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.65 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. WORKFLOW */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE EIN AUFTRAG LÄUFT' : 'HOW A JOB MOVES'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>{locale === 'de' ? 'Vom Foto auf der Baustelle bis zur bezahlten Rechnung.' : 'From the site photograph to the paid invoice.'}</h2>
            <Reveal style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {(locale === 'de' ? [
                { num: '01', title: 'Auftragszettel fotografieren', desc: 'Auf der Baustelle mit jedem Mobiltelefon. KI erstellt den vollständigen Auftragsdatensatz, Kunde, Umfang, Standortdetails, in unter 10 Sekunden. Keine manuelle Eingabe.' },
                { num: '02', title: 'Angebot erstellt',             desc: 'Marktpreise automatisch vorgeschlagen. Angebot formatiert und als PDF direkt vom System an den Kunden gesendet.' },
                { num: '03', title: 'Techniker disponiert',         desc: 'Auftrag dem richtigen Teammitglied zugewiesen. GPS-Check-in startet die Zeiterfassung bei Ankunft auf der Baustelle.' },
                { num: '04', title: 'Rechnung erstellt',            desc: 'Akzeptiertes Angebot wird mit einem Klick zur Rechnung. XRechnung XML automatisch für die Compliance angehängt.' },
                { num: '05', title: 'Zahlung verfolgt',             desc: 'Rechnung gesendet. Nachverfolgung automatisch ausgelöst, wenn die Zahlung überfällig ist. Status ohne E-Mail-Prüfung sichtbar.' },
              ] : [
                { num: '01', title: 'Photograph the job sheet', desc: 'Taken on site with any phone. AI creates the full job record, client, scope, site details, in under 10 seconds. No manual entry.' },
                { num: '02', title: 'Quote generated',         desc: 'Market-rate pricing suggested automatically. Quote formatted and sent as a PDF to the client directly from the system.' },
                { num: '03', title: 'Technician dispatched',   desc: 'Job assigned to the right team member. GPS check-in starts time tracking when they arrive on site.' },
                { num: '04', title: 'Invoice created',         desc: 'Accepted quote converts to invoice with one click. XRechnung XML generated and attached automatically for compliance.' },
                { num: '05', title: 'Payment tracked',         desc: 'Invoice sent. Follow-up triggered automatically if payment is overdue. Status visible without checking email.' },
              ]).map(step => (
                <div key={step.num} style={{ display: 'flex', gap: '32px', padding: '28px 0', borderBottom: `1px solid ${BORDER}`, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, minWidth: '32px', flexShrink: 0, paddingTop: '2px' }}>{step.num}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '6px' }}>{step.title}</h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </Reveal>

            <Reveal delay={200} style={{ marginTop: '3rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#444', marginBottom: '1rem' }}>{locale === 'de' ? 'DAS SYSTEM IM BETRIEB' : 'THE SYSTEM IN OPERATION'}</p>
              <Image
                src="/images/systems/handwerk-os/card/handwerk-os-de.png"
                alt={locale === 'de' ? 'HandwerkOS im Betrieb, Auftrag aus Foto erstellt, Angebot generiert' : 'HandwerkOS in operation, job record created from site photograph, quote generated'}
                width={1200}
                height={630}
                style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid #1A1A1A', display: 'block' }}
              />
            </Reveal>
          </div>
        </section>

        {/* 6. WHAT CHANGED */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WAS SICH NACH DER INSTALLATION VERÄNDERT HAT' : 'WHAT CHANGED AFTER INSTALLATION'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>{locale === 'de' ? 'Die Arbeit vor Ort ändert sich nicht. Alles drumherum schon.' : 'The work on site does not change. Everything around it does.'}</h2>
            <div style={{ background: BORDER, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{locale === 'de' ? 'VORHER' : 'BEFORE'}</p></div>
                <div style={{ padding: '14px 28px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{locale === 'de' ? 'NACHHER' : 'AFTER'}</p></div>
              </div>
              {(locale === 'de' ? [
                { before: 'Papierzettel → Büro-Neueingabe',                    after: 'Foto → Datensatz in 10 Sekunden erstellt'              },
                { before: 'Angebot aus dem Gedächtnis, Tage später gesendet',  after: 'Angebot aus Marktpreisen, sofort gesendet'             },
                { before: 'Zeit am Monatsende geschätzt',                       after: 'GPS-erfasst von Check-in bis Check-out'                },
                { before: 'Rechnung manuell pro Auftrag erstellt',              after: 'Ein Klick aus dem akzeptierten Angebot'                },
                { before: 'XRechnung XML jedes Mal manuell erstellt',           after: 'XRechnung automatisch bei Rechnungserstellung'         },
              ] : [
                { before: 'Paper job sheet → office re-entry',         after: 'Photo → record created in 10 seconds'         },
                { before: 'Quote from memory, sent days later',        after: 'Quote from market rates, sent immediately'    },
                { before: 'Time estimated at month-end',               after: 'GPS-tracked from check-in to check-out'       },
                { before: 'Invoice built manually per job',            after: 'One click from accepted quote'                },
                { before: 'XRechnung XML built by hand each time',    after: 'XRechnung generated automatically on invoice' },
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

        {/* 7. PROOF */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'DAS SYSTEM IN AKTION SEHEN' : 'SEE THE SYSTEM WORKING'}</p>
            <div className="hw-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${GREEN}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>{locale === 'de' ? 'Ein echter Auftragsablauf. Vom Foto bis zur Rechnung.' : 'A real job workflow. From the photograph to the invoice.'}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>{locale === 'de' ? 'Der Walkthrough umfasst eine Live-Session, Auftragszettel-Foto, KI-Datensatzerstellung, Angebotsgenerierung, Techniker-Disposition, GPS-Tracking und Rechnung mit XRechnung. Das System in Aktion, keine Featureliste.' : 'The walkthrough covers a live session, job sheet photo, AI record creation, quote generation, technician dispatch, GPS tracking, and invoice with XRechnung. The system working, not a feature list.'}</p>
              </div>
              <div style={{ background: CARD, padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{locale === 'de' ? 'WAS DER WALKTHROUGH ABDECKT' : 'WHAT THE WALKTHROUGH COVERS'}</p>
                {(locale === 'de' ? ['Foto zu Auftrag, Live-Demonstration', 'Angebotserstellung zu Marktpreisen', 'GPS-Disposition und Zeiterfassungsablauf', 'Ein-Klick-Rechnung mit XRechnung XML', 'Zahlungsverfolgung und Nachverfolgung'] : ['Photo to job record, live demonstration', 'Quote generation at market rates', 'GPS dispatch and time tracking flow', 'One-click invoice with XRechnung XML', 'Payment tracking and follow-up']).map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 8. WHAT HAPPENS NEXT */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE ES WEITERGEHT' : 'WHAT HAPPENS NEXT'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Vom ersten Gespräch bis zu Aufträgen, die durch das System laufen.' : 'From the first conversation to jobs running through the system.'}</h2>
            <div className="hw-grid-2">
              {(locale === 'de' ? [
                { num: '01', title: 'Kurzes Gespräch',      desc: 'Wir erfahren mehr über das Unternehmen, Gewerk, Teamgröße, aktueller Auftragsablauf und wo die meiste Zeit verloren geht.' },
                { num: '02', title: 'Workflow analysiert',  desc: 'Wir betrachten, wie Aufträge derzeit von der Baustelle zur Rechnung fließen, und konfigurieren das System um den bestehenden Prozess.' },
                { num: '03', title: 'System konfiguriert',  desc: 'HandwerkOS für das spezifische Gewerk eingerichtet, Auftragsvorlagen, Angebotspreise, Dispositionsablauf, Rechnungsformat.' },
                { num: '04', title: 'Mit einem Gewerk starten', desc: 'Beginnen Sie mit dem Auftragstyp, der die meiste Verwaltung erzeugt. Erweitern Sie im Unternehmen, wenn das Team vertraut wird.' },
              ] : [
                { num: '01', title: 'Short conversation',   desc: 'We learn about the business, trade type, team size, current job flow, and where the most time is lost.' },
                { num: '02', title: 'Workflow reviewed',    desc: 'We look at how jobs currently move from site to invoice and configure the system around the existing process.' },
                { num: '03', title: 'System configured',    desc: 'HandwerkOS set up for the specific trade, job templates, quote pricing, dispatch flow, invoice format.' },
                { num: '04', title: 'Start with one trade', desc: 'Begin with the job type that creates the most administration. Expand across the business as the team gets comfortable.' },
              ]).map(item => (
                <div key={item.num} style={{ background: '#141414', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '40px', color: `${ORANGE}25`, letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1 }}>{item.num}</p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ConnectedSystems systems={[
          { slug: 'taxkontrol', name: 'TaxKontrol', description: locale === 'de' ? 'Kosten und Pflichten verstehen.' : 'Understand costs and obligations.',              href: '/products/taxkontrol' },
          { slug: 'praxis-os',  name: 'PraxisOS',   description: locale === 'de' ? 'Inspiration für Termin- und Verwaltungsabläufe.' : 'Appointment and admin workflow inspiration.',   href: '/products/praxis-os'  },
          { slug: 'care-os',    name: 'CareOS',     description: locale === 'de' ? 'Feldeinsatz und Dokumentation.' : 'Field operations and documentation.',           href: '/products/care-os'    },
        ]} locale={locale} />

        {/* 9. CTA */}
        <section id="walkthrough" style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WALKTHROUGH PLANEN' : 'SCHEDULE A WALKTHROUGH'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>{locale === 'de' ? 'Sehen Sie das System für Ihr Gewerk in Aktion.' : 'See the system working for your trade.'}</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>{locale === 'de' ? 'Erzählen Sie uns vom Unternehmen und wie Aufträge derzeit durch das Team fließen. Wir führen durch das Live-System und zeigen, wie HandwerkOS zu Ihrer bestehenden Arbeitsweise passt.' : 'Tell us about the business and how jobs currently move through the team. We walk through the live system and show how HandwerkOS fits the way your operation already runs.'}</p>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: `1px solid ${BORDER}`, padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {(locale === 'de' ? ['Kurzes Gespräch zuerst, kein Commitment.', 'Konfiguriert für Ihr Gewerk und Ihren Ablauf.', 'Mit einem Auftragstyp starten. Erweitern wenn bereit.'] : ['Short conversation first, no commitment.', 'Configured to your trade and workflow.', 'Start with one job type. Expand when ready.']).map(l => (
                <p key={l} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666', margin: '4px 0', letterSpacing: '0.05em' }}>-{l}</p>
              ))}
            </div>
            <HandwerkContactForm locale={locale} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>{locale === 'de' ? '// Kein Commitment · Antwort innerhalb von 24 Stunden · Live-Demo auf Anfrage' : '// No commitment · Reply within 24 hours · Live demo available on request'}</p>
          </div>
        </section>

      </main>
    </>
  )
}
