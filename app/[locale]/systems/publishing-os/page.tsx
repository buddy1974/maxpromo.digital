import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Reveal } from '@/components/ui/Reveal'
import { ConnectedSystems } from '@/components/systems/ConnectedSystems'
import { PublishingContactForm } from './PublishingContactForm'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'PublishingOS | Manuskripte, Tantiemen & Distribution'
    : 'PublishingOS | Manuscripts, Royalties & Distribution'
  const description = isDE
    ? 'Manuskripte, Redaktionsabläufe und Autorenverträge in einem System, Tantiemen automatisch berechnet, 8 KI-Agenten laufen über Nacht.'
    : 'Manuscripts, editorial workflows and author contracts in one system, royalties calculated automatically, 8 AI agents running overnight.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/systems/publishing-os`,
      languages: {
        de: 'https://www.maxpromo.digital/de/systems/publishing-os',
        en: 'https://www.maxpromo.digital/en/systems/publishing-os',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/systems/publishing-os`,
    },
  }
}

const PURPLE = '#A78BFA'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .pb-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .pb-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  .pb-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .pb-grid-2 { grid-template-columns: 1fr; }
    .pb-flow   { flex-direction: column; }
    .pb-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
  .pb-cta-primary   { transition: background 150ms ease; }
  .pb-cta-primary:hover   { background: #EA6A00 !important; }
  .pb-cta-secondary { transition: border-color 150ms ease; }
  .pb-cta-secondary:hover { border-color: #333 !important; }
`

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export default async function PublishingOSPage({
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
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="pb-hero">
          <div>
            <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>{locale === 'de' ? 'VERLAGS-BETRIEBSSYSTEM' : 'PUBLISHING OPERATIONS SYSTEM'}</p>
            <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              {locale === 'de' ? <>Ein Manuskript trifft ein.<br />Fünf Systeme später:<br />noch kein vollständiger Überblick.</> : <>A manuscript arrives.<br />Five systems later:<br />still no complete picture.</>}
            </h1>
            <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              {locale === 'de' ? 'Manuskripte, Redaktionsabläufe und Autorenverträge, alles in einem System. Installiert auf Ihrer Domain.' : 'PublishingOS keeps orders, manuscripts, stock, royalties and distribution connected in one operational view, without replacing the editorial process that already works.'}
            </p>
            <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {(locale === 'de' ? ['Aufträge und Rechnungen in einem Ablauf', 'Manuskripte durch Produktionsstufen verfolgt', 'Tantiemen automatisch am Periodenende berechnet', '8 KI-Agenten laufen über Nacht'] : ['Orders and invoices in one flow', 'Manuscripts tracked through production stages', 'Royalties calculated automatically at period end', '8 AI agents running overnight']).map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="https://publishers24.org" target="_blank" rel="noopener noreferrer" className="pb-cta-primary"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }}
                >{locale === 'de' ? 'System ansehen →' : 'View system →'}</a>
              <Link href="/contact?system=publishing-os" className="pb-cta-secondary"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}
                >{locale === 'de' ? 'Demo anfragen →' : 'Request demo →'}</Link>
            </div>
          </div>
          <div className="mp-img-wrap mp-hero-2" style={{ borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}>
            <Image
              src={locale === 'de' ? '/images/systems/publishing-os/card/publishing-os-de.png' : '/images/systems/publishing-os/card/publishing-os-en.png'}
              alt={locale === 'de' ? 'Redaktioneller Verlagsablauf, Manuskripte, Produktionsverfolgung und Distribution' : 'Publishing editorial workflow, manuscripts, production tracking and distribution'}
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
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Dieselben operativen Lücken. Jede Saison.' : 'The same operational gaps. Every season.'}</h2>
            <div className="pb-grid-2">
              {(locale === 'de' ? [
                { label: 'DIE TABELLENTANTIÈME', text: 'Tantièmeperiode endet. Berechnungen beginnen in Excel, Verkaufszahlen aus einer Quelle, Rechtsbedingungen aus einer anderen, Abzüge aus einer dritten. Autor erhält die Abrechnung zwei Monate nach Periodenende.' },
                { label: 'DIE MANUSKRIPTVERSION', text: 'Manuskript geht an drei Lektoren. Jeder arbeitet in seiner eigenen Kopie. Änderungen in Kommentaren verfolgt. Die finale Version per E-Mail zusammengestellt. Versionshistorie existiert in sieben verschiedenen Dateien.' },
                { label: 'DIE LAGERLÜCKE', text: 'Auftrag kommt an. Rechnung in einem System erstellt. Lager in einem anderen aktualisiert, am Tagesende oder am Wochenende. Lagerstand, der dem Team sichtbar ist, liegt immer leicht hinter dem tatsächlichen Stand.' },
                { label: 'DIE DISTRIBUTIONSKETTE', text: 'Buch ist fertig. Distribution erfordert Daten in einem Format, das kein aktuelles System direkt exportiert. Jemand formatiert die Datei um. Jemand anderes prüft die Umformatierung. Distribution um drei Tage verzögert.' },
              ] : [
                { label: 'THE SPREADSHEET ROYALTY', text: "Royalty period ends. Calculations begin in Excel, sales figures from one source, rights terms from another, deductions from a third. Author receives the statement two months after the period closes." },
                { label: 'THE MANUSCRIPT VERSION', text: "Manuscript goes to three editors. Each works in their own copy. Changes tracked in comments. The final version assembled by email. Version history exists in seven different files." },
                { label: 'THE STOCK GAP', text: "Order arrives. Invoice raised in one system. Stock updated in another, at the end of the day, or the end of the week. Stock level visible to the team is always slightly behind the actual stock level." },
                { label: 'THE DISTRIBUTION CHAIN', text: "Book is ready. Distribution requires data in a format that no current system exports directly. Someone reformats the file. Someone else checks the reformat. Distribution delayed by three days." },
              ]).map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${PURPLE}` }}>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE VERLAGSOPERATIONEN DERZEIT LAUFEN' : 'HOW PUBLISHING OPERATIONS MOVE RIGHT NOW'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Jede Systemgrenze ist ein Ort, an dem Daten erneut eingegeben oder umformatiert werden müssen.' : 'Every system boundary is a place where data must be re-entered or re-formatted.'}</h2>
            <div className="pb-flow">
              {(locale === 'de' ? [
                { step: '01', label: 'Auftrag kommt an',      note: 'In System eins eingetragen' },
                { step: '02', label: 'Rechnung erstellt',      note: 'In System zwei' },
                { step: '03', label: 'Lager aktualisiert',     note: 'System drei, Tagesende' },
                { step: '04', label: 'Manuskript verfolgt',    note: 'Tabelle, separat' },
                { step: '05', label: 'Tantième berechnet',     note: 'Excel, Periodenende' },
              ] : [
                { step: '01', label: 'Order arrives',      note: 'Logged in system one' },
                { step: '02', label: 'Invoice raised',     note: 'In system two' },
                { step: '03', label: 'Stock updated',      note: 'System three, end of day' },
                { step: '04', label: 'Manuscript tracked', note: 'Spreadsheet, separate' },
                { step: '05', label: 'Royalty calculated', note: 'Excel, end of period' },
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
                  {locale === 'de' ? 'Aufträge, Manuskripte, Lager, Tantiemen und Distribution, verbunden in einem System.' : 'Orders, manuscripts, stock, royalties and distribution, connected in one system.'}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  {locale === 'de' ? 'Auftrag kommt an. Rechnung automatisch erstellt. Lager sofort aktualisiert. Manuskript durch Produktionsstufen verfolgt. Tantiemen am Periodenende berechnet, nicht manuell zusammengestellt. Acht KI-Agenten laufen über Nacht und verarbeiten Daten, Distribution und Kommunikation.' : 'Order arrives. Invoice generated automatically. Stock updated immediately. Manuscript tracked through production stages. Royalties calculated at period end, not assembled manually. Eight AI agents run overnight handling data processing, distribution updates and communications.'}
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${PURPLE}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{locale === 'de' ? 'WAS VERBUNDEN WIRD' : 'WHAT CONNECTS'}</p>
                {(locale === 'de' ? ['Aufträge, Rechnung und Lager automatisch bei Eingang aktualisiert', 'Manuskripte, Produktionsstufen in einer Ansicht verfolgt', 'Lager, live, nicht am Tagesende aktualisiert', 'Tantiemen, am Periodenende berechnet, kein manuelles Excel', 'Distribution, formatiert und gesendet ohne Umformatierung', '8 KI-Agenten, Nachtverarbeitung, Updates und Kommunikation'] : ['Orders, invoice and stock updated automatically on receipt', 'Manuscripts, production stages tracked in one view', 'Stock, live, not updated at end of day', 'Royalties, calculated at period end, no manual Excel', 'Distribution, formatted and sent without reformatting', '8 AI agents, overnight processing, updates and communications']).map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: PURPLE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE VERLAGSOPERATIONEN LAUFEN' : 'HOW PUBLISHING OPERATIONS MOVE'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>{locale === 'de' ? 'Von Auftragseingang bis Tantièmeabrechnung, in einem System.' : 'From order receipt to royalty statement, in one system.'}</h2>
            <Reveal style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {(locale === 'de' ? [
                { num: '01', title: 'Auftrag erhalten',              desc: 'Auftrag geht ins System. Rechnung automatisch erstellt. Lagerstand sofort aktualisiert, nicht am Tagesende.' },
                { num: '02', title: 'Manuskript in Produktion',      desc: 'Manuskript durch Lektorat, Design und Produktionsstufen verfolgt. Alle Versionen an einem Ort. Keine E-Mail-basierte Versionskontrolle.' },
                { num: '03', title: 'Distribution vorbereitet',      desc: 'Distributionsdaten automatisch formatiert, wenn der Titel fertig ist. Keine manuelle Umformatierung für Distributionspartner erforderlich.' },
                { num: '04', title: 'Tantièmeperiode endet',         desc: 'Verkaufszahlen automatisch zusammengestellt. Tantiemen gegen bereits im System hinterlegte Rechtsbedingungen berechnet. Abrechnung erstellt, kein Excel erforderlich.' },
                { num: '05', title: 'KI-Agenten über Nacht',         desc: 'Acht Agenten laufen über Nacht, Lagerbestände aktualisieren, Distributionsbestätigungen verarbeiten, Kommunikation senden und Berichte für den nächsten Tag vorbereiten.' },
              ] : [
                { num: '01', title: 'Order received',         desc: 'Order enters the system. Invoice generated automatically. Stock level updated immediately, not at end of day.' },
                { num: '02', title: 'Manuscript in production', desc: 'Manuscript tracked through editorial, design and production stages. All versions in one place. No email-based version control.' },
                { num: '03', title: 'Distribution prepared',   desc: 'Distribution data formatted automatically when the title is ready. No manual reformatting required for distribution partners.' },
                { num: '04', title: 'Royalty period closes',   desc: 'Sales figures compiled automatically. Royalties calculated against the rights terms already in the system. Statement generated, no Excel required.' },
                { num: '05', title: 'AI agents overnight',     desc: 'Eight agents run overnight, updating stock positions, processing distribution confirmations, sending communications and preparing reports for the next day.' },
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
                src="/images/systems/publishing-os/card/publishing-os-de.png"
                alt={locale === 'de' ? 'PublishingOS im Betrieb, Aufträge, Manuskripte, Tantiemen und Distribution verbunden' : 'PublishingOS in operation, orders, manuscripts, royalties and distribution connected'}
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
            <div style={{ background: BORDER, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{locale === 'de' ? 'VORHER' : 'BEFORE'}</p></div>
                <div style={{ padding: '14px 28px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{locale === 'de' ? 'NACHHER' : 'AFTER'}</p></div>
              </div>
              {(locale === 'de' ? [
                { before: 'Aufträge in einem System eingetragen, in einem anderen berechnet', after: 'Auftrag und Rechnung in einem Schritt, automatisiert'      },
                { before: 'Lager am Tagesende aus einem separaten System aktualisiert',       after: 'Lager live, sofort bei Auftragseingang aktualisiert'      },
                { before: 'Tantiemen in Excel am Periodenende berechnet',                      after: 'Tantiemen automatisch berechnet wenn Periode endet'       },
                { before: 'Manuskripte über E-Mail-Versionen verfolgt',                        after: 'Produktionsstufen in einer Ansicht sichtbar'              },
                { before: 'Distributionsdaten jedes Mal manuell umformatiert',                 after: 'Distribution automatisch formatiert, kein manueller Schritt' },
              ] : [
                { before: 'Orders logged in one system, invoiced in another',    after: 'Order and invoice in one step, automated'           },
                { before: 'Stock updated at end of day from a separate system',  after: 'Stock live, updated immediately on order receipt'   },
                { before: 'Royalties calculated in Excel at period end',         after: 'Royalties calculated automatically when period closes' },
                { before: 'Manuscripts tracked across email versions',           after: 'Production stages visible in one view'               },
                { before: 'Distribution data reformatted manually each time',   after: 'Distribution formatted automatically, no manual step' },
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

        {/* 7–8. PROOF + NEXT */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div className="pb-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${PURPLE}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>{locale === 'de' ? 'Ein echter Verlagsablauf, vom Auftrag bis zur Tantièmeabrechnung.' : 'A real publishing workflow, from order to royalty statement.'}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>{locale === 'de' ? 'Der Walkthrough umfasst Auftragsverwaltung, Manuskript-Produktionsverfolgung, Lagersichtbarkeit, Tantièmenberechnung und die KI-Agenten-Nachtansicht. Das vollständige System, keine Featureliste.' : 'The walkthrough covers order management, manuscript production tracking, stock visibility, royalty calculation and the overnight AI agent view. The full system, not a feature list.'}</p>
              </div>
              <div style={{ background: CARD, padding: '40px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>{locale === 'de' ? 'WIE ES WEITERGEHT' : 'WHAT HAPPENS NEXT'}</p>
                {(locale === 'de' ? [
                  { num: '01', t: 'Kurzes Gespräch',     d: 'Wir erfahren mehr über das Unternehmen, Kataloggröße, Teamstruktur, aktuelle Systeme und die größten operativen Lücken.' },
                  { num: '02', t: 'Workflow analysiert',  d: 'Wir kartieren, wie Aufträge, Manuskripte, Tantiemen und Distribution derzeit fließen, bevor wir etwas konfigurieren.' },
                  { num: '03', t: 'System konfiguriert',  d: 'PublishingOS für den spezifischen Katalog und die Rechtsstruktur eingerichtet, Tantièmebedingungen, Distributionspartner, Produktionsstufen.' },
                  { num: '04', t: 'Mit Aufträgen starten', d: 'Beginnen Sie mit Auftrags- und Rechnungsfluss. Manuskripte, Lager und Tantiemen hinzufügen, wenn das Team Vertrauen ins System aufgebaut hat.' },
                ] : [
                  { num: '01', t: 'Short conversation',    d: 'We learn about the company, catalogue size, team structure, current systems and the biggest operational gaps.' },
                  { num: '02', t: 'Workflow reviewed',     d: 'We map how orders, manuscripts, royalties and distribution currently move before configuring anything.' },
                  { num: '03', t: 'System configured',     d: 'PublishingOS set up for the specific catalogue and rights structure, royalty terms, distribution partners, production stages.' },
                  { num: '04', t: 'Start with orders',     d: 'Begin with order and invoice flow. Add manuscripts, stock and royalties as the team builds confidence in the system.' },
                ]).map(item => (
                  <div key={item.num} style={{ marginBottom: '20px' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, margin: '0 0 4px', letterSpacing: '0.1em' }}>{item.num}</p>
                    <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', color: '#F0F0F0', margin: '0 0 4px' }}>{item.t}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#666666', margin: 0, lineHeight: 1.6 }}>{item.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ConnectedSystems systems={[
          { slug: 'printshop-os',  name: 'PrintShopOS', description: locale === 'de' ? 'Produktionsworkflow-Abstimmung.' : 'Production workflow alignment.',  href: '/systems/printshop-os'    },
          { slug: 'taxkontrol',    name: 'TaxKontrol',  description: locale === 'de' ? 'Geschäftsübersicht.' : 'Business visibility.',            href: '/systems/taxkontrol'   },
          { slug: 'real-estate-os', name: 'RealEstateOS', description: locale === 'de' ? 'Pipeline-Management.' : 'Pipeline management.',          href: '/products/real-estate-os'},
        ]} locale={locale} />

        {/* 9. CTA */}
        <section id="walkthrough" style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WALKTHROUGH PLANEN' : 'SCHEDULE A WALKTHROUGH'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>{locale === 'de' ? 'Sehen Sie PublishingOS für Ihren Betrieb in Aktion.' : 'See PublishingOS working for your operation.'}</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>{locale === 'de' ? 'Erzählen Sie uns vom Unternehmen. Wir führen durch das Live-System und zeigen, wie PublishingOS zur Art passt, wie Ihr Team Aufträge, Produktion und Autorenbeziehungen verwaltet.' : 'Tell us about the company. We walk through the live system and show how PublishingOS fits the way your team manages orders, production and author relationships.'}</p>
            <PublishingContactForm locale={locale} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>{locale === 'de' ? '// Kein Commitment · Antwort innerhalb von 24 Stunden · Live-Demo auf Anfrage' : '// No commitment · Reply within 24 hours · System operational for publishing companies'}</p>
          </div>
        </section>

      </main>
    </>
  )
}
