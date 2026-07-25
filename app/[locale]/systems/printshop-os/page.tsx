import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Reveal } from '@/components/ui/Reveal'
import { ConnectedSystems } from '@/components/systems/ConnectedSystems'
import { Link } from '@/i18n/navigation'
import { PrintshopContactForm } from './PrintshopContactForm'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'PrintShopOS | Dateiprüfung, Angebote & Auftrags-Routing'
    : 'PrintShopOS | File Validation, Quotes & Job Routing'
  const description = isDE
    ? 'Automatische Dateiprüfung, Auftrags-Routing und Kundenkommunikation in einem System, Dateiprobleme erkennen, bevor sie zu Nachdrucken werden.'
    : 'Automatic file validation, job routing and customer updates in one system, catch file issues before they become expensive reprints.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/systems/printshop-os`,
      languages: {
        de: 'https://www.maxpromo.digital/de/systems/printshop-os',
        en: 'https://www.maxpromo.digital/en/systems/printshop-os',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/systems/printshop-os`,
    },
  }
}

/* ─── CMYK TOKENS ─────────────────────────────────────────── */
const C      = '#00AEEF'
const M      = '#EC008C'
const Y      = '#FFF200'
const K      = '#1A1A1A'
const INK    = '#0A0A0A'
const ORANGE = '#F97316'

const STYLES = `
  .ps-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${INK}; }
  .ps-flow   { display: flex; gap: 2px; background: ${INK}; overflow-x: auto; }
  .ps-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  .ink-card  { background: #FFFFFF; padding: 28px 32px; }
  .cmyk-dot  { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  @media (max-width: 768px) {
    .ps-grid-2 { grid-template-columns: 1fr; }
    .ps-flow   { flex-direction: column; }
    .ps-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
  .ps-cta-primary   { transition: background 150ms ease; }
  .ps-cta-primary:hover   { background: #333 !important; }
  .ps-cta-secondary { transition: all 150ms ease; }
  .ps-cta-secondary:hover { background: ${INK} !important; color: #FFF !important; }
`

/* ─── PAGE ────────────────────────────────────────────────── */

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export default async function PrintshopPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: '#FFFFFF' }}>

        {/* ── 1. HERO WORLD ── */}
        <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: `2px solid ${INK}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="ps-hero">
          <div>
            <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
              {locale === 'de' ? 'DRUCK-WORKFLOW-SYSTEM' : 'PRINT WORKFLOW SYSTEM'}
            </p>
            <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', letterSpacing: '-0.04em', color: INK, lineHeight: 1.05, marginBottom: '1.5rem', maxWidth: '760px' }}>
              {locale === 'de' ? 'Dateiprobleme erkennen, bevor sie zu teuren Nachdrucken werden.' : 'Catch file issues before they become expensive reprints.'}
            </h1>
            <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#444444', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              {locale === 'de' ? 'Automatische Dateiprüfung, Auftrags-Routing und Kundenkommunikation, alles in einem System.' : 'PrintShopOS keeps quotes, artwork validation and production handovers moving in one workflow, without rebuilding how your print shop already works.'}
            </p>

            {/* Proof chips */}
            <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '2.5rem' }}>
              {(locale === 'de' ? [
                { label: 'Angebote ohne E-Mail-Ping-Pong', color: C },
                { label: 'Dateien vor der Druckmaschine geprüft', color: M },
                { label: 'Produktion von Zahlung bis Lieferung verfolgt', color: Y },
                { label: 'Kunden automatisch informiert', color: ORANGE },
              ] : [
                { label: 'Quotes without back-and-forth email', color: C },
                { label: 'Files validated before they reach the press', color: M },
                { label: 'Production tracked from payment to delivery', color: Y },
                { label: 'Customers updated automatically', color: ORANGE },
              ]).map(p => (
                <span key={p.label} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: INK, border: `2px solid ${INK}`, borderTop: `4px solid ${p.color}`, padding: '6px 14px', letterSpacing: '0.04em', background: '#FAFAF8' }}>
                  → {p.label}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
              <a href="https://smartprintshop.de" target="_blank" rel="noopener noreferrer" className="ps-cta-primary"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FFFFFF', background: INK, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', border: `2px solid ${INK}` }}
                >
                {locale === 'de' ? 'System ansehen →' : 'View system →'}
              </a>
              <Link href="/contact?system=printshop-os" className="ps-cta-secondary"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: INK, border: `2px solid ${INK}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}
                >
                {locale === 'de' ? 'Demo anfragen →' : 'Request demo →'}
              </Link>
            </div>

            {/* CMYK identity strip */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[C, M, Y, K].map((col, i) => <span key={i} className="cmyk-dot" style={{ background: col, border: `1px solid ${INK}` }} />)}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#888', marginLeft: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {locale === 'de' ? 'EN · DE · FR · Stripe-Zahlungen aktiv' : 'EN · DE · FR · Stripe payments active'}
              </span>
            </div>
          </div>
          <div className="mp-img-wrap mp-hero-2" style={{ borderRadius: '8px', border: `2px solid ${INK}` }}>
            <Image
              src={locale === 'de' ? '/images/systems/printshop-os/card/printshop-os-de.png' : '/images/systems/printshop-os/card/printshop-os-en.png'}
              alt={locale === 'de' ? 'Druckproduktions-Workflow, Artwork wird geprüft und für die Druckmaschine vorbereitet' : 'Print production workflow, artwork being validated and prepared for press'}
              width={760}
              height={400}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              priority
            />
          </div>
          </div>
        </section>

        {/* ── 2. THIS KEEPS HAPPENING ── */}
        <section style={{ background: '#FAFAF8', borderBottom: `2px solid ${INK}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {locale === 'de' ? 'DAS PASSIERT IMMER WIEDER' : 'THIS KEEPS HAPPENING'}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '2.5rem' }}>
              {locale === 'de' ? 'Dieselben Situationen. Jede Woche.' : 'The same situations. Every week.'}
            </h2>
            <div className="ps-grid-2" style={{ border: `2px solid ${INK}` }}>
              {(locale === 'de' ? [
                { color: C, label: 'DIE ANGEBOTS-E-MAIL',
                  text: 'Ein Kunde schreibt mit Spezifikationen. Sie antworten mit einem Angebot. Er antwortet mit Änderungen. Sie senden ein überarbeitetes Angebot. Vier Tage vergehen. Noch kein Auftrag.' },
                { color: M, label: 'DAS DATEIPROBLEM',
                  text: 'Artwork kommt an. Sieht auf dem Bildschirm gut aus. Der Beschnitt ist falsch. Die Auflösung ist unzureichend. Das entdecken Sie nach dem Drucklauf. Die Nachdruckkosten gehen auf die Marge.' },
                { color: Y, label: 'DER EILAUFTRAG',
                  text: 'Ein dringender Auftrag kommt an. Er wird zur Tabellenkalkulation hinzugefügt. Jemand aktualisiert die falsche Zeile. Der Auftrag ist zu spät. Der Kunde erfährt es, wenn er nachfragt.' },
                { color: ORANGE, label: 'DIE RECHNUNGSANFRAGE',
                  text: 'Auftrag ist abgeschlossen. Kunde fragt nach seiner Rechnung. Sie öffnen die Vorlage, füllen die Details aus, hängen das PDF an, senden die E-Mail. Zwanzig Minuten pro Auftrag, für jeden Auftrag.' },
              ] : [
                { color: C, label: 'THE QUOTE EMAIL',
                  text: 'A customer emails with specs. You reply with a quote. They reply with changes. You send a revised quote. Four days pass. No order yet.' },
                { color: M, label: 'THE FILE PROBLEM',
                  text: 'Artwork arrives. It looks fine on screen. The bleed is wrong. The resolution is insufficient. You discover this after the press run. The reprint cost comes out of the margin.' },
                { color: Y, label: 'THE RUSH JOB',
                  text: 'An urgent order arrives. It gets added to the spreadsheet. Someone updates the wrong row. The job is late. The customer finds out when they follow up.' },
                { color: ORANGE, label: 'THE INVOICE REQUEST',
                  text: 'Job is complete. Customer asks for their invoice. You open the template, fill in the details, attach the PDF, send the email. Twenty minutes per job, every job.' },
              ]).map(item => (
                <div key={item.label} className="ink-card" style={{ borderTop: `4px solid ${item.color}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: item.color === Y ? '#888' : item.color, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px', fontWeight: 700 }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#444', lineHeight: 1.8, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CMYK divider ── */}
        <div style={{ display: 'flex', width: '100%', borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}` }}>
          {([{ bg: C }, { bg: M }, { bg: Y }, { bg: K }] as const).map(({ bg }, i) => (
            <div key={i} style={{ flex: 1, background: bg, height: '60px', borderRight: i < 3 ? `1px solid ${INK}` : 'none' }} />
          ))}
        </div>

        {/* ── 3. OPERATIONAL CHAOS ── */}
        <section style={{ background: '#FFFFFF', borderBottom: `2px solid ${INK}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {locale === 'de' ? 'WIE AUFTRÄGE DERZEIT LAUFEN' : 'HOW ORDERS MOVE RIGHT NOW'}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '2.5rem' }}>
              {locale === 'de' ? 'Jeder manuelle Schritt ist ein Ort, an dem Zeit und Marge verloren gehen.' : 'Every manual step is a place where time and margin are lost.'}
            </h2>
            <div className="ps-flow">
              {(locale === 'de' ? [
                { step: '01', label: 'Angebot per E-Mail',     note: 'Hin und Her erforderlich',  color: C },
                { step: '02', label: 'Datei kommt an',          note: 'Manuell geprüft',           color: M },
                { step: '03', label: 'Drucklauf',               note: 'Fehler hier entdeckt',      color: Y },
                { step: '04', label: 'Nachdruck',               note: 'Marge absorbiert',          color: ORANGE },
                { step: '05', label: 'Manuelle Rechnung',       note: '20 Minuten pro Auftrag',    color: K },
              ] : [
                { step: '01', label: 'Quote by email',       note: 'Back-and-forth required',   color: C },
                { step: '02', label: 'File arrives',          note: 'Checked manually',          color: M },
                { step: '03', label: 'Press run',             note: 'Error discovered here',     color: Y },
                { step: '04', label: 'Reprint',               note: 'Margin absorbed',           color: ORANGE },
                { step: '05', label: 'Manual invoice',        note: '20 minutes per job',        color: K },
              ]).map(item => (
                <div key={item.step} style={{ background: '#FFFFFF', border: `1px solid ${INK}`, borderTop: `4px solid ${item.color}`, padding: '24px 20px', flex: 1, minWidth: '140px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '18px', color: item.color === Y ? '#888' : item.color, margin: '0 0 8px' }}>{item.step}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: INK, margin: '0 0 4px', lineHeight: 1.4, fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#888', margin: 0, letterSpacing: '0.05em' }}>{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. SYSTEM INSTALLED ── */}
        <section style={{ background: INK, borderBottom: `2px solid #333`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
              {locale === 'de' ? 'SYSTEM INSTALLIERT' : 'SYSTEM INSTALLED'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#FFFFFF', lineHeight: 1.2, marginBottom: '1.5rem' }}>
                  {locale === 'de' ? 'PrintShopOS prüft Dateien, organisiert die Produktion und hält Aufträge in Bewegung, sobald eine Anfrage eingeht.' : 'PrintShopOS validates files, organizes production and keeps orders moving from the moment a request arrives.'}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  {locale === 'de' ? 'Kunden konfigurieren ihre Bestellung und laden Artwork direkt hoch. Das System prüft DPI, Beschnitt, Farben und Abmessungen, bevor die Datei die Druckmaschine erreicht. Fehlerhafte Dateien werden beim Upload abgelehnt, nicht nach dem Druck.' : 'Customers configure their order and upload artwork directly. The system checks DPI, bleed, colours and dimensions before the file reaches the press. Bad files are rejected at the upload step, not after printing.'}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginTop: '1rem' }}>
                  {locale === 'de' ? 'Jeder Auftrag geht automatisch in eine Produktionswarteschlange. Rechnungen werden bei Zahlung erstellt. Kunden werden ohne Telefonanruf informiert.' : 'Every order enters a production queue automatically. Invoices generated on payment. Customers updated without a phone call.'}
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${C}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{locale === 'de' ? 'WAS AUTOMATISCH LÄUFT' : 'WHAT RUNS AUTOMATICALLY'}</p>
                {(locale === 'de' ? [
                  { text: 'Dateiprüfung, vor dem Drucklauf, jedes Mal', color: C },
                  { text: 'Produktionswarteschlange, pro Auftrag aktualisiert, keine manuelle Eingabe', color: M },
                  { text: 'Rechnungserstellung, bei Zahlungsbestätigung', color: Y },
                  { text: 'Kundeninformierung, Status ohne Mitarbeiterbeteiligung gesendet', color: ORANGE },
                ] : [
                  { text: 'File validation, before the press run, every time', color: C },
                  { text: 'Production queue, updated per order, no manual entry', color: M },
                  { text: 'Invoice generation, on payment confirmation', color: Y },
                  { text: 'Customer updates, status sent without staff involvement', color: ORANGE },
                ]).map(item => (
                  <div key={item.text} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                    <span style={{ color: item.color, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.65 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. WORKFLOW ── */}
        <section style={{ background: '#FFFFFF', borderBottom: `2px solid ${INK}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {locale === 'de' ? 'WIE EIN AUFTRAG LÄUFT' : 'HOW AN ORDER MOVES'}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '3rem' }}>
              {locale === 'de' ? 'Von der ersten Anfrage bis zur Lieferung. Ohne das Hin und Her.' : 'From the first request to delivery. Without the back-and-forth.'}
            </h2>
            <Reveal style={{ display: 'flex', flexDirection: 'column', borderTop: `2px solid ${INK}` }}>
              {(locale === 'de' ? [
                { num: '01', color: C,      title: 'Kunde konfiguriert und bestellt', desc: 'Wählt Produkt, Größe und Menge. Preis berechnet sich in Echtzeit. Keine Angebotsanfrage. Keine E-Mail. Kein Warten.' },
                { num: '02', color: M,      title: 'Artwork hochgeladen',              desc: 'Kunde lädt die Datei direkt hoch. Das System prüft sofort, Auflösung, Beschnitt, Farbprofil, Abmessungen.' },
                { num: '03', color: Y,      title: 'Datei automatisch geprüft',        desc: 'Probleme werden vor Produktionsbeginn gemeldet. Kunde korrigiert und lädt erneut hoch. Keine Mitarbeiterbeteiligung für Standarddateien.' },
                { num: '04', color: ORANGE, title: 'Zahlung bestätigt',                desc: 'Auftrag per Stripe bezahlt. Rechnung automatisch erstellt. Kunde erhält Bestätigung. Produktionswarteschlange aktualisiert.' },
                { num: '05', color: C,      title: 'Produktion bis Lieferung',         desc: 'Auftrag durch Produktionsstufen verfolgt. Kunde an Schlüsselpunkten benachrichtigt. Keine Telefonanrufe für Statusaktualisierungen erforderlich.' },
              ] : [
                { num: '01', color: C,      title: 'Customer configures and orders', desc: 'Selects product, size and quantity. Price calculates in real time. No quote request. No email. No waiting.' },
                { num: '02', color: M,      title: 'Artwork uploaded',               desc: 'Customer uploads the file directly. The system checks it immediately, resolution, bleed, colour profile, dimensions.' },
                { num: '03', color: Y,      title: 'File validated automatically',   desc: 'Issues flagged before production begins. Customer corrects and re-uploads. No staff involvement needed for standard files.' },
                { num: '04', color: ORANGE, title: 'Payment confirmed',              desc: 'Order paid via Stripe. Invoice generated automatically. Customer receives confirmation. Production queue updated.' },
                { num: '05', color: C,      title: 'Production to delivery',         desc: 'Job tracked through production stages. Customer notified at key points. No phone calls required for status updates.' },
              ]).map(step => (
                <div key={step.num} style={{ display: 'flex', gap: '32px', padding: '28px 0', borderBottom: `2px solid ${INK}`, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '20px', color: step.color, minWidth: '40px', flexShrink: 0, paddingTop: '2px' }}>{step.num}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: INK, letterSpacing: '-0.02em', marginBottom: '6px' }}>{step.title}</h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#555', lineHeight: 1.75, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </Reveal>

            <Reveal delay={200} style={{ marginTop: '3rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888', marginBottom: '1rem' }}>{locale === 'de' ? 'DAS SYSTEM IM BETRIEB' : 'THE SYSTEM IN OPERATION'}</p>
              <Image
                src="/images/systems/printshop-os/card/printshop-os-de.png"
                alt={locale === 'de' ? 'PrintShopOS im Betrieb, Dateiprüfung, Produktionswarteschlange und Auftragsverwaltung' : 'PrintShopOS in operation, file validation, production queue and order management'}
                width={1200}
                height={630}
                style={{ width: '100%', height: 'auto', borderRadius: '8px', border: `2px solid ${INK}`, display: 'block' }}
              />
            </Reveal>
          </div>
        </section>

        {/* ── 6. WHAT CHANGED ── */}
        <section style={{ background: '#FAFAF8', borderBottom: `2px solid ${INK}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {locale === 'de' ? 'WAS SICH NACH DER INSTALLATION VERÄNDERT HAT' : 'WHAT CHANGED AFTER INSTALLATION'}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '2rem' }}>
              {locale === 'de' ? 'Die Druckerei arbeitet gleich. Die Aufträge laufen anders.' : 'The shop runs the same way. The orders move differently.'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: INK, border: `2px solid ${INK}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F0F0F0' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${INK}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{locale === 'de' ? 'VORHER' : 'BEFORE'}</p>
                </div>
                <div style={{ padding: '14px 28px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: C, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>{locale === 'de' ? 'NACHHER' : 'AFTER'}</p>
                </div>
              </div>
              {(locale === 'de' ? [
                { before: 'Angebote per E-Mail, tagelang hin und her',          after: 'Kunde konfiguriert und bezahlt ohne Kontakt' },
                { before: 'Fehlerhafte Dateien nach dem Drucklauf entdeckt',     after: 'Dateifehler beim Upload erkannt, vor der Produktion' },
                { before: 'Produktion in einer gemeinsamen Tabelle verfolgt',    after: 'Jeder Auftrag automatisch ab Zahlung verfolgt' },
                { before: 'Rechnungen manuell pro Auftrag erstellt',             after: 'Rechnung bei Zahlung erstellt, automatisch' },
                { before: 'Kunde ruft für Statusupdate an',                      after: 'Kunde in jeder Produktionsstufe benachrichtigt' },
              ] : [
                { before: 'Quotes sent by email, days of back-and-forth', after: 'Customer configures and pays without contacting you' },
                { before: 'Bad files found after the press run',           after: 'File issues caught at upload, before production'   },
                { before: 'Production tracked in a shared spreadsheet',   after: 'Every order tracked automatically from payment'     },
                { before: 'Invoices created manually per job',            after: 'Invoice generated on payment, automatically'       },
                { before: 'Customer calls for a status update',           after: 'Customer notified at each production stage'         },
              ]).map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="ink-card" style={{ borderRight: `1px solid ${INK}`, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#CC0000', flexShrink: 0, paddingTop: '2px' }}>✕</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#555', margin: 0, lineHeight: 1.6 }}>{row.before}</p>
                  </div>
                  <div className="ink-card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: C, flexShrink: 0, paddingTop: '2px', fontWeight: 700 }}>✓</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: INK, margin: 0, lineHeight: 1.6 }}>{row.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. PROOF ── */}
        <section style={{ background: '#FFFFFF', borderBottom: `2px solid ${INK}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {locale === 'de' ? 'DAS SYSTEM IN AKTION SEHEN' : 'SEE THE SYSTEM WORKING'}
            </p>
            <div className="ps-grid-2" style={{ border: `2px solid ${INK}` }}>
              <div className="ink-card" style={{ borderTop: `4px solid ${C}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: INK, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                  {locale === 'de' ? 'Ein echter Druckablauf. Von hochgeladenem Artwork bis zum Produktionsabschluss.' : 'A real print workflow. From uploaded artwork to production completion.'}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#444', lineHeight: 1.8 }}>
                  {locale === 'de' ? 'Der Walkthrough umfasst eine Live-Session, Kunden-Auftragsablauf, Dateiprüfung in Aktion, Produktionswarteschlangen-Ansicht und Rechnungserstellung. Das System in Aktion, keine Präsentation darüber.' : 'The walkthrough covers a live session, customer order flow, file validation in action, production queue view, and invoice generation. The system running, not a presentation about the system.'}
                </p>
              </div>
              <div className="ink-card" style={{ borderTop: `4px solid ${M}` }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{locale === 'de' ? 'WAS DER WALKTHROUGH ABDECKT' : 'WHAT THE WALKTHROUGH COVERS'}</p>
                {(locale === 'de' ? [
                  'Kunden-Selbstbedienungs-Auftragsablauf, keine E-Mail erforderlich',
                  'Dateiprüfung, was das System erkennt und wie',
                  'Produktionswarteschlange, Auftragsverfolgung von Zahlung bis Lieferung',
                  'Admin-Ansicht, vollständige Auftragsverwaltung und Status',
                  'Mehrsprachige Plattform, EN / DE / FR in einem System',
                ] : [
                  'Customer self-serve order flow, no email required',
                  'File validation, what the system catches and how',
                  'Production queue, order tracking from payment to delivery',
                  'Admin view, full order management and status',
                  'Multilingual platform, EN / DE / FR in one system',
                ]).map(line => (
                  <div key={line} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: C, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#444', margin: 0, lineHeight: 1.6 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. WHAT HAPPENS NEXT ── */}
        <section style={{ background: '#FAFAF8', borderBottom: `2px solid ${INK}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {locale === 'de' ? 'WIE ES WEITERGEHT' : 'WHAT HAPPENS NEXT'}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '2.5rem' }}>
              {locale === 'de' ? 'Vom ersten Gespräch bis zur laufenden Plattform.' : 'From the first conversation to a running platform.'}
            </h2>
            <div className="ps-grid-2" style={{ border: `2px solid ${INK}` }}>
              {(locale === 'de' ? [
                { num: '01', color: C,      title: 'Kurzes Gespräch',     desc: 'Wir erfahren mehr über die Druckerei, welche Produkte Sie anbieten, wie Aufträge ankommen, wo derzeit die Reibung liegt.' },
                { num: '02', color: M,      title: 'Katalog analysiert',  desc: 'Wir schauen uns Ihr Produktsortiment an und konfigurieren Preise, Größenoptionen und Upload-Anforderungen rund um Ihr aktuelles Angebot.' },
                { num: '03', color: Y,      title: 'Workflow konfiguriert', desc: 'PrintShopOS für Ihren Produktionsprozess eingerichtet, Validierungsregeln, Warteschlangenstufen, Kundenkommunikation.' },
                { num: '04', color: ORANGE, title: 'Schrittweise starten', desc: 'Beginnen Sie mit einer Produktkategorie. Fügen Sie weitere hinzu, wenn der Ablauf vertraut wird. Kein vollständiger Umstieg am ersten Tag erforderlich.' },
              ] : [
                { num: '01', color: C,      title: 'Short conversation',    desc: 'We learn about the print shop, what products you offer, how orders arrive, where the friction is currently.' },
                { num: '02', color: M,      title: 'Catalogue reviewed',    desc: 'We look at your product range and configure pricing, sizing options and upload requirements around your current offering.' },
                { num: '03', color: Y,      title: 'Workflow configured',   desc: 'PrintShopOS is set up for your production process, validation rules, queue stages, customer communication.' },
                { num: '04', color: ORANGE, title: 'Launch gradually',      desc: 'Start with one product category. Add more as the workflow becomes familiar. No full switchover required on day one.' },
              ]).map(item => (
                <div key={item.num} className="ink-card" style={{ borderTop: `4px solid ${item.color}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '40px', color: item.color === Y ? '#DDD' : `${item.color}60`, letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1 }}>{item.num}</p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: INK, letterSpacing: '-0.02em', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#555', lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ConnectedSystems systems={[
          { slug: 'taxkontrol',   name: 'TaxKontrol',   description: locale === 'de' ? 'Rücklagen und finanzielle Verpflichtungen im Blick.' : 'Keep reserves and financial obligations visible.', href: '/systems/taxkontrol'   },
          { slug: 'handwerk-os', name: 'HandwerkOS',   description: locale === 'de' ? 'Produktion und Feldbetrieb verbinden.' : 'Connect production and field operations.',         href: '/systems/handwerk-os'  },
          { slug: 'publishing-os', name: 'PublishingOS', description: locale === 'de' ? 'Produktions- und Distributionsabläufe verwalten.' : 'Manage production and distribution workflows.',   href: '/systems/publishing-os'},
        ]} locale={locale} />

        {/* ── 9. CTA ── */}
        <section id="walkthrough" style={{ background: Y, padding: '6rem 2rem', borderTop: `2px solid ${INK}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
              {[C, M, Y, K].map((col, i) => <span key={i} className="cmyk-dot" style={{ background: col, border: `2px solid ${INK}`, width: '12px', height: '12px' }} />)}
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: INK, opacity: 0.6, marginBottom: '1rem' }}>
              {locale === 'de' ? 'WALKTHROUGH ANFRAGEN' : 'REQUEST A WALKTHROUGH'}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '1rem' }}>
              {locale === 'de' ? 'Sehen Sie PrintShopOS in einer echten Druckumgebung.' : 'See PrintShopOS working in a real print environment.'}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#333', lineHeight: 1.8, maxWidth: '520px' }}>
              {locale === 'de' ? 'Erzählen Sie uns von der Druckerei. Wir führen durch den Live-Workflow und zeigen, wie PrintShopOS zur spezifischen Arbeitsweise Ihrer Druckerei passt.' : 'Tell us about the print shop. We walk through the live workflow and show how PrintShopOS fits the specific way your shop already operates.'}
            </p>
            <div style={{ marginTop: '1.5rem', background: '#FFFFFF', border: `2px solid ${INK}`, padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {(locale === 'de' ? ['Kurzes Gespräch zuerst, kein Commitment.', 'Konfiguriert für Ihren Produktkatalog.', 'Mit einer Kategorie starten. Erweitern wenn bereit.'] : ['Short conversation first, no commitment.', 'Configured to your product catalogue.', 'Start with one category. Expand when ready.']).map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#444', margin: '4px 0', letterSpacing: '0.05em' }}>-{line}</p>
              ))}
            </div>
            <PrintshopContactForm locale={locale} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: INK, opacity: 0.5, marginTop: '1.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {locale === 'de' ? 'Begrenzte Plätze · Einrichtung in 5–10 Tagen · Ihr Katalog, Ihre Domain' : 'Limited slots · Setup in 5–10 days · Your catalogue, your domain'}
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
