import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Reveal } from '@/components/ui/Reveal'
import { ConnectedSystems } from '@/components/systems/ConnectedSystems'
import { ScreenshotSlot } from '@/components/ui/ScreenshotSlot'
import { AccessRequestForm } from './AccessRequestForm'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'TaxKontrol | Steuerrücklage & Fristen täglich sichtbar'
    : 'TaxKontrol | Tax Reserve & Deadlines Visible Every Day'
  const description = isDE
    ? 'TaxKontrol hält Steuern, Rücklagen und Fristen täglich sichtbar, ELSTER-fertige Daten, DSGVO-konform, ohne Ihren bestehenden Ablauf zu verändern.'
    : 'TaxKontrol keeps taxes, reserves and filing deadlines visible daily, ELSTER-ready data, DSGVO compliant, without changing how your business already operates.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/systems/taxkontrol`,
      languages: {
        de: 'https://www.maxpromo.digital/de/systems/taxkontrol',
        en: 'https://www.maxpromo.digital/en/systems/taxkontrol',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/systems/taxkontrol`,
    },
  }
}

/* ─── TOKENS ──────────────────────────────────────────────── */
const NAVY   = '#1E3A5F'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .tk-grid-2      { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .tk-hero        { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  .tk-proof-main  { display: grid; grid-template-columns: 2fr 3fr; gap: 4rem; align-items: start; }
  .tk-proof-grid  { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 3rem; }
  .tk-cta-primary  { transition: background 150ms ease; }
  .tk-cta-primary:hover  { background: #EA6A00 !important; }
  .tk-cta-secondary { transition: border-color 150ms ease; }
  .tk-cta-secondary:hover { border-color: #333 !important; }
  @media (max-width: 768px) {
    .tk-grid-2     { grid-template-columns: 1fr; }
    .tk-hero       { grid-template-columns: 1fr; gap: 2rem; }
    .tk-proof-main { grid-template-columns: 1fr; gap: 2rem; }
    .tk-proof-grid { grid-template-columns: 1fr; gap: 2rem; }
  }
`

/* ─── LOCALE HELPER ───────────────────────────────────────── */
function t(locale: string, de: string, en: string): string {
  return locale === 'de' ? de : en
}

/* ─── PROOF IMAGE PATHS ───────────────────────────────────────
 * Drop screenshots into public/images/systems/taxkontrol/proof/
 * then change null → the path string to activate the slot.
 * All four slots are wired into the page, set src to enable.
 * ──────────────────────────────────────────────────────────── */
const PROOF = {
  reserve:   '/images/systems/taxkontrol/proof/reserve-dashboard.png',
  deadlines: '/images/systems/taxkontrol/proof/deadline-overview.png',
  income:    '/images/systems/taxkontrol/proof/income-expense.png',
  quarterly: '/images/systems/taxkontrol/proof/quarterly-view.png',
}

/* ─── STATIC PARAMS ───────────────────────────────────────── */
export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

/* ─── PAGE ────────────────────────────────────────────────── */
export default async function TaxKontrolPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  /* ── Section data ──────────────────────────────────────── */

  const workflow = [
    {
      num:   '01',
      title: t(locale, 'Die Bank verbinden',         'Connect the business'),
      desc:  t(locale,
        'Bankkonto verbunden oder Transaktionen manuell eingegeben. Das System beginnt in Echtzeit ein Bild von Einnahmen, Ausgaben und der Steuerposition aufzubauen.',
        'Bank account connected or transactions entered manually. The system begins building a picture of income, expenses and the tax position in real time.'),
    },
    {
      num:   '02',
      title: t(locale, 'Ausgaben täglich erfassen',    'Expenses captured daily'),
      desc:  t(locale,
        'Belege werden erfasst, wenn sie anfallen. Nichts aufheben für später. Der Ordner am Jahresende hört auf, ein Problem zu sein.',
        'Receipts photographed when they happen. Nothing saved for later. The folder at the end of the year stops being a problem.'),
    },
    {
      num:   '03',
      title: t(locale, 'Rücklage immer sichtbar',      'Reserve visible at all times'),
      desc:  t(locale,
        'Was für Steuern zurückgestellt werden muss, wird kontinuierlich berechnet. Der Inhaber muss nicht schätzen, die Zahl ist bereits vorhanden.',
        'What needs to be set aside for taxes is calculated continuously. The business owner does not have to estimate, the number is already there.'),
    },
    {
      num:   '04',
      title: t(locale, 'Fristen automatisch verfolgen', 'Deadlines tracked automatically'),
      desc:  t(locale,
        'Alle Abgabetermine für den Unternehmenstyp werden an einem Ort verfolgt. Kein Suchen auf Behördenwebsites, was wann fällig ist.',
        'All filing dates for the business type are tracked in one place. No searching across government websites for what is due and when.'),
    },
    {
      num:   '05',
      title: t(locale, 'Exportbereit, wenn benötigt',  'Export ready when needed'),
      desc:  t(locale,
        'ELSTER-fertige Daten stehen jederzeit bereit, für den Steuerberater oder die eigene Einreichung. Kein manuelles Umformatieren vor der Abgabe.',
        'ELSTER-ready data prepared and available whenever the accountant or the owner needs it. No manual reformatting before submission.'),
    },
  ]

  const whatChanges = [
    {
      before: t(locale, 'Steuerposition unbekannt bis zur Abgabefrist',   'Tax position unknown until filing season'),
      after:  t(locale, 'Rücklage täglich sichtbar, keine Überraschungen', 'Reserve visible every day, no surprises'),
    },
    {
      before: t(locale, 'Belege monatelang in einem Ordner gesammelt', 'Receipts collected in a folder for months'),
      after:  t(locale, 'Ausgaben erfasst, wenn sie anfallen',          'Expenses captured when they happen'),
    },
    {
      before: t(locale, 'Quartalsfristen verpasst oder geschätzt',   'Quarterly deadlines missed or guessed at'),
      after:  t(locale, 'Alle Fristen in einer Übersicht verfolgt',   'All deadlines tracked in one view'),
    },
    {
      before: t(locale, 'Steuerberater erhält ungeordnete Unterlagen', 'Accountant receives disorganized records'),
      after:  t(locale, 'ELSTER-fertige Daten sofort übergeben',        'ELSTER-ready data handed over immediately'),
    },
  ]

  const afterYes = [
    {
      step:  '01',
      title: t(locale, 'Kurzes Gespräch',          'Short conversation'),
      desc:  t(locale,
        'Wir erfahren mehr über das Unternehmen, wie Einnahmen eingehen, wie Ausgaben aussehen, wo der Druck aktuell am größten ist.',
        'We learn about the business, how income arrives, what expenses look like, where the pressure is currently coming from.'),
    },
    {
      step:  '02',
      title: t(locale, 'Aktuellen Ablauf erfassen', 'Map the current flow'),
      desc:  t(locale,
        'Wir schauen, was bereits erfasst wird und was nicht. Die Einrichtung passt sich dem realen Ablauf an, nicht einer Vorlage.',
        'We look at what is already being tracked and what is not. The setup is built around the real workflow, not a template.'),
    },
    {
      step:  '03',
      title: t(locale, 'System konfiguriert',       'System configured'),
      desc:  t(locale,
        'TaxKontrol wird für den spezifischen Unternehmenstyp, Abgabezyklus und Rücklagenbedarf eingerichtet, ab dem ersten Tag einsatzbereit.',
        'TaxKontrol is set up for the specific business type, filing cycle, and reserve requirements, ready to use from the first day.'),
    },
    {
      step:  '04',
      title: t(locale, 'Ab Tag eins im Betrieb',    'Running from day one'),
      desc:  t(locale,
        'Der Inhaber hat ab dem Tag der Konfiguration eine Live-Übersicht über Einnahmen, Ausgaben, Rücklage und Fristen.',
        'The business owner has a live view of income, expenses, reserve and deadlines from the day the system is configured.'),
    },
  ]

  const trustItems = [
    t(locale, 'DSGVO-konform',                  'DSGVO compliant'),
    t(locale, 'In Deutschland gehostet',         'Hosted in Germany'),
    t(locale, 'ELSTER-fertige Vorbereitung',     'ELSTER-ready preparation'),
    t(locale, 'Für deutsche Unternehmen gebaut', 'Built for German businesses'),
  ]

  const whatVisible = [
    t(locale,
      'Steuerrücklage, in Echtzeit aktualisiert, wenn Einnahmen eingehen',
      'Tax reserve, updated in real time as income arrives'),
    t(locale,
      'Quartalsfristen, für den spezifischen Unternehmenstyp',
      'Quarterly filing deadlines, for the specific business type'),
    t(locale,
      'Jahressteuerposition, keine Jahresendzahl, sondern eine laufende Summe',
      'Annual tax position, not a year-end calculation but a running total'),
    t(locale,
      'Ausgabenprotokoll, täglich erfasst, nicht erst zum Abgabezeitpunkt',
      'Expense record, captured daily, not collected at filing time'),
    t(locale,
      'ELSTER-fertiger Export, verfügbar, wenn Steuerberater oder Einreichung ihn braucht',
      'ELSTER-ready export, available when the accountant or submission needs it'),
  ]

  /* ── ConnectedSystems copy ─────────────────────────────── */
  const connectedSystems = locale === 'de'
    ? [
        { slug: 'restaurant-os', name: 'RestaurantOS', description: 'Betriebliche Aktivität und Umsatzfluss sehen.',    href: '/systems/restaurant-os' },
        { slug: 'handwerk-os',   name: 'HandwerkOS',   description: 'Aufträge und Rechnungsbewegung verfolgen.',        href: '/systems/handwerk-os'   },
        { slug: 'printshop-os',  name: 'PrintShopOS',  description: 'Produktion und Finanzen im Blick behalten.',      href: '/systems/printshop-os'  },
      ]
    : [
        { slug: 'restaurant-os', name: 'RestaurantOS', description: 'See operational activity and revenue flow.',       href: '/systems/restaurant-os' },
        { slug: 'handwerk-os',   name: 'HandwerkOS',   description: 'Track jobs and invoice movement.',                href: '/systems/handwerk-os'   },
        { slug: 'printshop-os',  name: 'PrintShopOS',  description: 'Keep production and finance visible.',            href: '/systems/printshop-os'  },
      ]

  /* ── Pain cards ────────────────────────────────────────── */
  const painCards = [
    {
      label: t(locale, 'QUARTALSVORANMELDUNGEN', 'QUARTERLY FILING'),
      text:  t(locale,
        'Viermal im Jahr fällig. Unternehmer schätzen, was sie einreichen. Ob die Schätzung gehalten hat, erfahren sie drei Monate später.',
        'Due four times a year. Business owners estimate what to submit. They find out if the estimate held three months later.'),
    },
    {
      label: t(locale, 'JAHRESABRECHNUNG', 'ANNUAL CALCULATION'),
      text:  t(locale,
        'Das vollständige Bild kommt im Frühjahr. Die Umsätze waren stark. Die Steuerlast ist es auch. Der Zeitpunkt passt selten zur Liquidität.',
        'The full picture arrives in spring. Revenue was strong. The tax liability is also strong. The timing rarely aligns with cash.'),
    },
    {
      label: t(locale, 'BELEGSTAU', 'RECEIPT BACKLOG'),
      text:  t(locale,
        'Belege und Unterlagen häufen sich über das Jahr an. Sie werden zum Abgabeproblem, wenn die Frist naht. Dann zum dringenden Problem.',
        'Receipts and records accumulate across the year. They become a filing problem when the deadline is close. Then an urgent problem.'),
    },
  ]

  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* ── HERO ── */}
        <section style={{ padding: '5rem 2rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="tk-hero">
            <div>
              <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
                {t(locale, 'TAXKONTROL · FINANZKONTROLLSYSTEM', 'TAXKONTROL · FINANCIAL VISIBILITY SYSTEM')}
              </p>
              <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '2rem', maxWidth: '720px' }}>
                {locale === 'de'
                  ? <>Behalten Sie den Überblick-<br />bevor das Finanzamt Sie überrascht.</>
                  : <>Know where your business stands-<br />before tax season tells you.</>
                }
              </h1>
              <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '560px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
                {t(locale,
                  'TaxKontrol hält Steuern, Rücklagen und Fristen täglich sichtbar, ohne den bestehenden Ablauf Ihres Unternehmens zu verändern.',
                  'TaxKontrol keeps taxes, reserves and obligations visible, without changing how your business already operates.')}
              </p>
              <div className="mp-hero-4" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <a
                  href="https://taxkontrol.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tk-cta-primary"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }}
                >
                  {t(locale, 'System ansehen →', 'View system →')}
                </a>
                <Link
                  href="/contact?system=taxkontrol"
                  className="tk-cta-secondary"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}
                >
                  {t(locale, 'Demo anfragen →', 'Request demo →')}
                </Link>
              </div>

              {/* Trust strip, Phase 3: contrast raised to #666 */}
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '2.5rem', paddingTop: '2rem', borderTop: `1px solid ${BORDER}` }}>
                {trustItems.map(item => (
                  <span key={item} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                   , {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mp-img-wrap mp-hero-2" style={{ borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}>
              <Image
                src="/images/systems/taxkontrol/card/taxkontrol-en.png"
                alt={t(locale,
                  'Unternehmensinhaber prüft Finanzkennzahlen, Steuerrücklage und Fristen täglich sichtbar',
                  'Business owner reviewing financial position, tax reserve and obligations visible')}
                width={760}
                height={400}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                priority
              />
            </div>
          </div>
        </section>

        {/* ── THE SITUATION ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
                {t(locale, 'DIE SITUATION', 'THE SITUATION')}
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: '1.5rem' }}>
                {t(locale,
                  'Die meisten Unternehmen in Deutschland haben keine klare Übersicht über ihre Steuerposition. Nicht weil die Inhaber nachlässig sind. Sondern weil die Werkzeuge nicht für die Art gebaut wurden, wie sie tatsächlich arbeiten.',
                  'Most businesses in Germany operate without a clear view of their tax position. Not because the owners are careless. Because the tools were not built for how they actually work.')}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                {t(locale,
                  'Steuerliche Pflichten in Deutschland sind quartalsweise und jährlich. Sie umfassen Umsatzsteuer, Einkommensteuer, Gewerbesteuer und Vorauszahlungen, oft nach unterschiedlichen Zeitplänen, bei verschiedenen Behörden. Die meisten Unternehmer erfahren, was sie schulden, wenn die Berechnung bereits vorliegt. Bis dahin sind die Möglichkeiten begrenzt.',
                  'Tax obligations in Germany are quarterly and annual. They involve VAT, income tax, trade tax, and advance payments, often on different schedules, submitted to different authorities. Most business owners find out what they owe when the calculation is already done. By then, the options are limited.')}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: BORDER }}>
              {painCards.map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '28px 32px', borderTop: `3px solid ${NAVY}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REAL SCENE ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '2rem' }}>
              {t(locale, 'WAS DAS IN DER PRAXIS BEDEUTET', 'WHAT THIS LOOKS LIKE IN PRACTICE')}
            </p>
            <div style={{ maxWidth: '640px' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1.35, marginBottom: '1.5rem' }}>
                {locale === 'de' ? (
                  <>März ist da.<br />Rechnungen wurden bezahlt. Das Geschäft sah gut aus.<br />Dann: „Wie viel davon gehört eigentlich mir?&ldquo;</>
                ) : (
                  <>March arrives.<br />Invoices were paid. Business looked healthy.<br />Then: &ldquo;How much of this actually belongs to me?&rdquo;</>
                )}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                {t(locale,
                  'Der Steuerbescheid kommt. Die Zahl stimmt, das Unternehmen hat es verdient. Aber die Steuerrücklage wurde nicht verfolgt. Das Geld floss durch das Konto und wurde für den Betrieb ausgegeben. Der Inhaber zahlt die Nachzahlung in Raten und nimmt sich vor, das Jahr anders anzugehen. Das Muster wiederholt sich.',
                  'The Steuerbescheid arrives. The number is correct, the business earned it. But the Steuerrücklage was not tracked. The money moved through the account and was spent on operations. The owner pays the Nachzahlung in instalments and resolves to start the year differently. The pattern repeats.')}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                {t(locale,
                  'Die Quartalsvorauszahlung ist fällig. Das Unternehmen reicht sie anhand der Zahlen des Vorjahres ein. Das Unternehmen ist gewachsen. Der Schätzwert ist zu niedrig. Das Finanzamt passt ihn nach oben an. Ein Brief erklärt den neuen Betrag.',
                  'The quarterly Vorauszahlung arrives. The business files it based on last year\'s figure. The business has grown. The estimate is too low. The Finanzamt adjusts it upward. A letter arrives explaining the new amount.')}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                {t(locale,
                  'Das sind keine Versäumnisse der Disziplin. Das deutsche Steuersystem wurde nicht für Unternehmen ohne Buchhaltungsabteilung konzipiert. TaxKontrol ist das System, das diese Lücke schließt, tägliche Sichtbarkeit statt jährliche Entdeckung.',
                  'These are not failures of discipline. The German tax system was not designed for businesses without accounting departments. TaxKontrol is the system that fills that gap, daily visibility, not annual discovery.')}
              </p>
            </div>
          </div>
        </section>

        {/* ── KLEINUNTERNEHMER CALLOUT (Phase 5) ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div style={{ borderLeft: `3px solid ${NAVY}`, paddingLeft: '2rem', maxWidth: '680px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
                {t(locale, '§19 USTG · KLEINUNTERNEHMERREGELUNG', '§19 USTG · KLEINUNTERNEHMER')}
              </p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: '1.25rem' }}>
                {t(locale, 'Kleines Unternehmen. Echter Schwellenwert.', 'Small business. Real threshold.')}
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8, marginBottom: '1rem' }}>
                {t(locale,
                  'Die Kleinunternehmerregelung befreit Unternehmen von der Umsatzsteuerpflicht, solange der Jahresumsatz unter 22.000 Euro bleibt. Was viele nicht wissen: Wer die Grenze überschreitet, muss ab dem Folgejahr Umsatzsteuer erheben und quartalsweise Voranmeldungen einreichen. Wer sie im laufenden Jahr reißt, muss noch im selben Jahr damit beginnen.',
                  'The Kleinunternehmer exemption removes the obligation to charge VAT, as long as annual revenue stays below €22,000. What many miss: crossing the threshold means charging VAT from the following year. Exceeding it during the current year means quarterly Umsatzsteuervoranmeldungen start immediately.')}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>
                {t(locale,
                  'TaxKontrol hält den Jahresumsatz kontinuierlich im Blick, damit kein Auftrag, keine Stunde und keine Rechnung unbemerkt über die Schwelle führt.',
                  'TaxKontrol tracks annual revenue in real time, so no invoice, project hour, or appointment crosses the threshold unnoticed.')}
              </p>
            </div>
          </div>
        </section>

        {/* ── SYSTEM INSTALLED ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
              {t(locale, 'SYSTEM INSTALLIERT', 'SYSTEM INSTALLED')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: '1.5rem' }}>
                  {t(locale,
                    'TaxKontrol wird in das Unternehmen installiert. Die Steuerposition wird täglich sichtbar.',
                    'TaxKontrol is installed into the business. The tax position becomes visible, every day.')}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                  {t(locale,
                    'Einnahmen werden erfasst, wenn sie eingehen. Ausgaben werden verbucht, wenn sie anfallen. Die Rücklage wird in Echtzeit berechnet. Abgabefristen sind sichtbar, bevor sie dringend werden.',
                    'Income tracked as it arrives. Expenses recorded when they happen. The reserve calculated in real time. Filing deadlines visible before they become urgent.')}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  {t(locale,
                    'Der Inhaber wird kein Steuerexperte. Er bekommt eine klare Zahl, was ihm gehört, was dem Finanzamt gehört, was eingereicht werden muss und wann. Das ist der gesamte Umfang des Systems.',
                    'The business owner does not become a tax specialist. They get a clear number, what is theirs, what belongs to the Finanzamt, what needs to be submitted and when. That is the entire scope of the system.')}
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${NAVY}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                  {t(locale, 'WAS TÄGLICH SICHTBAR WIRD', 'WHAT BECOMES VISIBLE')}
                </p>
                {whatVisible.map(item => (
                  <div key={item} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.65 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WORKFLOW ── */}
        <section id="workflow" style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {t(locale, 'WIE DAS SYSTEM FUNKTIONIERT', 'HOW THE SYSTEM WORKS')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              {t(locale, 'Fünf Schritte. Beginnt mit dem aktuellen Ablauf.', 'Five steps. Starts with the current process.')}
            </h2>
            <Reveal style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {workflow.map(step => (
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
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666', marginBottom: '1rem' }}>
                {t(locale, 'DAS SYSTEM IM BETRIEB', 'THE SYSTEM IN OPERATION')}
              </p>
              <Image
                src="/images/systems/taxkontrol/card/taxkontrol-de.png"
                alt={t(locale,
                  'TaxKontrol-Dashboard, Steuerrücklage, Fristen und Ausgaben täglich sichtbar',
                  'TaxKontrol dashboard, tax reserve, deadlines and expense tracking visible daily')}
                width={1200}
                height={630}
                style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid #1A1A1A', display: 'block' }}
              />
            </Reveal>
          </div>
        </section>

        {/* ── WHAT CHANGES ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {t(locale, 'WAS SICH NACH DER INSTALLATION ÄNDERT', 'WHAT CHANGES AFTER INSTALLATION')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>
              {t(locale,
                'Das Unternehmen verändert sich nicht. Was der Inhaber sehen kann, schon.',
                'The business does not change. What the owner can see does.')}
            </h2>
            <div style={{ background: BORDER, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                    {t(locale, 'VORHER', 'BEFORE')}
                  </p>
                </div>
                <div style={{ padding: '14px 28px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                    {t(locale, 'NACHHER', 'AFTER')}
                  </p>
                </div>
              </div>
              {whatChanges.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                  <div style={{ padding: '18px 28px', borderRight: `1px solid ${BORDER}`, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#555', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>✕</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#555555', margin: 0, lineHeight: 1.6 }}>{row.before}</p>
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

        {/* ── SEE THE SYSTEM ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {t(locale, 'DAS SYSTEM IM EINSATZ', 'SEE THE SYSTEM')}
            </p>

            {/* Main proof layout: LEFT explanation · RIGHT primary screenshot slot */}
            <div className="tk-proof-main">

              {/* LEFT, explanation copy */}
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                  {t(locale, 'WAS SIE TÄGLICH SEHEN', 'WHAT YOU SEE EVERY DAY')}
                </p>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1.25, marginBottom: '1.5rem' }}>
                  {locale === 'de'
                    ? <>Rücklage.<br />Fristen.<br />Ausgaben.</>
                    : <>Reserve.<br />Deadlines.<br />Expenses.</>
                  }
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                  {t(locale,
                    'Keine Jahresendauswertung. Kein Warten auf den Steuerberater. Das System zeigt die Steuerposition täglich, in Echtzeit, sobald eine Transaktion erfasst wird.',
                    'No year-end calculation. No waiting for the accountant. The system shows the tax position every day, in real time, as each transaction is recorded.')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
                  {[
                    t(locale, 'Steuerrücklage, täglich aktualisiert',        'Tax reserve, updated daily'),
                    t(locale, 'Nächste Abgabefrist, immer im Blick',         'Next filing deadline, always visible'),
                    t(locale, 'Ausgaben, erfasst, wenn sie anfallen',         'Expenses, captured when they happen'),
                    t(locale, 'ELSTER-Export, jederzeit verfügbar',           'ELSTER export, available at any time'),
                  ].map(line => (
                    <div key={line} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>→</span>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>{line}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', lineHeight: 1.7, letterSpacing: '0.04em' }}>
                  {t(locale,
                    '-Walkthrough zeigt das Live-System, konfiguriert für Ihren Unternehmenstyp.',
                    '-Walkthrough shows the live system, configured for your business type.')}
                </p>
              </div>

              {/* RIGHT, primary screenshot: reserve-dashboard (Übersicht) */}
              <ScreenshotSlot
                src={PROOF.reserve}
                alt={t(locale,
                  'TaxKontrol Übersicht, Steuerrücklage, Gewinnentwicklung und Nächste Verpflichtungen',
                  'TaxKontrol overview, tax reserve, profit development and upcoming obligations')}
                width={1200}
                height={750}
                caption={t(locale, 'Finanzübersicht', 'Financial overview')}
                subcaption={t(locale,
                  'Steuerrücklage, Gewinnentwicklung und nächste Fristen, auf einem Bildschirm.',
                  'Tax reserve, income trend and next deadlines, on one screen.')}
                priority={false}
              />
            </div>

            {/* Secondary screenshot grid, 3 operational proof shots */}
            {(PROOF.deadlines ?? PROOF.income ?? PROOF.quarterly) && (
              <div className="tk-proof-grid">
                <ScreenshotSlot
                  src={PROOF.deadlines}
                  alt={t(locale,
                    'TaxKontrol, Nächste Zahlung: Umsatzsteuervoranmeldung mit Datum und Betrag',
                    'TaxKontrol, next payment: VAT pre-declaration with date and amount')}
                  width={1200}
                  height={750}
                  caption={t(locale, 'Fristen & nächste Zahlung', 'Deadlines and next payment')}
                  subcaption={t(locale,
                    'Umsatzsteuervoranmeldung und Vorauszahlungen, sichtbar bevor sie dringend werden.',
                    'VAT pre-declaration and advance payments, visible before they become urgent.')}
                />
                <ScreenshotSlot
                  src={PROOF.income}
                  alt={t(locale,
                    'TaxKontrol, Geldfluss: Einnahmen, Reserve, Ausgaben und verfügbares Geld',
                    'TaxKontrol, cash flow: income, tax reserve, expenses and available funds')}
                  width={1200}
                  height={750}
                  caption={t(locale, 'Geldfluss im Überblick', 'Cash flow overview')}
                  subcaption={t(locale,
                    'Einnahmen, Steuerreserve und verfügbares Geld, in Echtzeit getrennt.',
                    'Income, tax reserve and available funds, separated in real time.')}
                />
                <ScreenshotSlot
                  src={PROOF.quarterly}
                  alt={t(locale,
                    'TaxKontrol, Steuerberater-Übergabe: DATEV-Export und Belegpaket bereit',
                    'TaxKontrol, accountant handover: DATEV export and document package ready')}
                  width={1200}
                  height={750}
                  caption={t(locale, 'Steuerberater-Übergabe', 'Accountant handover')}
                  subcaption={t(locale,
                    'DATEV-Export, Belege und Unterlagen, vollständig und auf Knopfdruck bereit.',
                    'DATEV export, receipts and documents, complete and ready on demand.')}
                />
              </div>
            )}
          </div>
        </section>

        {/*
          ── PILOT OUTCOME BLOCK ─────────────────────────────────────────────
          Uncomment and populate when real operational outcome data is available.
          Structure: anonymized business type · concrete outcome · metric.
          No fake business names. No testimonials. No star ratings.

          Data required before enabling:
            businessType , e.g. "Friseursalon" / "Fotostudio" / "Freelance IT"
            city         , general, e.g. "Berlin" (no street/full address)
            outcome      , one clear operational improvement
            metric       , one specific, verifiable number (reserve accuracy, % saving, etc.)

          <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
            <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '2rem' }}>
                {t(locale, 'ERSTE ERGEBNISSE', 'EARLY RESULTS')}
              </p>
              <div style={{ maxWidth: '560px', borderLeft: `3px solid ${NAVY}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 1rem' }}>
                  {t(locale, '[UNTERNEHMENSTYP] · [STADT]', '[BUSINESS TYPE] · [CITY]')}
                </p>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', color: '#F0F0F0', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '1rem' }}>
                  {t(locale, '[OUTCOME IN ONE SENTENCE, DE]', '[OUTCOME IN ONE SENTENCE, EN]')}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>
                  {t(locale, '[OPERATIONAL DETAIL, DE]', '[OPERATIONAL DETAIL, EN]')}
                </p>
              </div>
            </div>
          </section>
        */}

        {/* ── WHAT HAPPENS NEXT ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {t(locale, 'WAS ALS NÄCHSTES PASSIERT', 'WHAT HAPPENS NEXT')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              {t(locale,
                'Vom ersten Gespräch zum laufenden System. Keine Vorabverpflichtung.',
                'From the first conversation to a running system. No commitment required upfront.')}
            </h2>
            <div className="tk-grid-2">
              {afterYes.map(item => (
                <div key={item.step} style={{ background: '#141414', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '40px', color: `${NAVY}50`, letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1 }}>
                    {item.step}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ConnectedSystems systems={connectedSystems} locale={locale} />

        {/* ── STEUERBERATER FAQ (Phase 4) ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '2rem' }}>
              {t(locale, 'HÄUFIG GEFRAGT', 'COMMON QUESTION')}
            </p>
            <div style={{ maxWidth: '640px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: '1.25rem' }}>
                {t(locale,
                  'Ersetzt TaxKontrol meinen Steuerberater?',
                  'Does TaxKontrol replace my Steuerberater?')}
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginBottom: '1rem' }}>
                {t(locale,
                  'Nein. TaxKontrol ersetzt keinen Steuerberater und erteilt keine Steuerberatung.',
                  'No. TaxKontrol does not replace a tax advisor and does not provide tax advice.')}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                {t(locale,
                  'Was das System leistet: Einnahmen, Ausgaben und Fristen täglich sichtbar machen, damit Gespräche mit dem Steuerberater kürzer, klarer und weniger stressig werden. Wer geordnete Unterlagen übergibt, zahlt weniger Stundenhonorar. Wer die Rücklage täglich sieht, kommt ohne Überraschungsgespräche durch das Jahr.',
                  'What the system does: make income, expenses and deadlines visible every day, so conversations with your Steuerberater become shorter, cleaner and less stressful. Organised records at handover mean fewer billable hours. A daily reserve view means no unexpected calls when the filing deadline arrives.')}
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="walkthrough" style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              {t(locale, 'VORFÜHRUNG ANFRAGEN', 'REQUEST A WALKTHROUGH')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>
              {t(locale,
                'Sehen Sie das System für Ihren Unternehmenstyp.',
                'See the system working in your type of business.')}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              {t(locale,
                'Wir zeigen das Live-System, Rücklage-Tracking, Fristenübersicht, Ausgabenerfassung und Export, konfiguriert für Ihren spezifischen Unternehmenstyp und Abgabezyklus.',
                'We walk through the live system, reserve tracking, deadline view, expense capture and export, configured for your specific business and filing requirements.')}
            </p>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: `1px solid ${BORDER}`, padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {(locale === 'de'
                ? ['Kurzes Gespräch zuerst, keine Verpflichtung.', 'System auf Ihr Unternehmen zugeschnitten.', 'Ab dem ersten Tag im Betrieb.']
                : ['Short conversation first, no commitment.', 'System configured around your business.', 'Running from the first day.']
              ).map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666', margin: '4px 0', letterSpacing: '0.05em' }}>-{line}</p>
              ))}
            </div>

            <AccessRequestForm locale={locale} />

            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', letterSpacing: '0.08em', margin: '16px 0 0' }}>
              {t(locale,
                '// DSGVO-konform · In Deutschland gehostet · Antwort innerhalb von 24 Stunden',
                '// DSGVO compliant · Hosted in Germany · Reply within 24 hours')}
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
