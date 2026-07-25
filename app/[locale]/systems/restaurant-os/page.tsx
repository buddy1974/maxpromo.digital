import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Reveal } from '@/components/ui/Reveal'
import { ConnectedSystems } from '@/components/systems/ConnectedSystems'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'RestaurantOS | QR-Bestellung, Küchenrouting & Zahlung'
    : 'RestaurantOS | QR Ordering, Kitchen Routing & Payment'
  const description = isDE
    ? 'QR-Bestellung, Küchenrouting und Zahlung in einem System. Keine App für Gäste, kein Tablet für das Personal, installiert auf Ihrer eigenen Domain.'
    : 'QR ordering, kitchen routing and payment in one system. No app for guests, no tablet for staff, installed on your own domain.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/systems/restaurant-os`,
      languages: {
        de: 'https://www.maxpromo.digital/de/systems/restaurant-os',
        en: 'https://www.maxpromo.digital/en/systems/restaurant-os',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/systems/restaurant-os`,
    },
  }
}

/* ─── TOKENS ──────────────────────────────────────────────── */
const AMBER  = '#FBBF24'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .ro-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .ro-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: ${BORDER}; }
  .ro-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  .ro-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .ro-grid-2 { grid-template-columns: 1fr; }
    .ro-grid-3 { grid-template-columns: 1fr; }
    .ro-flow   { flex-direction: column; }
    .ro-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
  .ro-cta-primary   { transition: background 150ms ease; }
  .ro-cta-primary:hover   { background: #EA6A00 !important; }
  .ro-cta-secondary { transition: border-color 150ms ease; }
  .ro-cta-secondary:hover { border-color: #333 !important; }
`

/* ─── PAGE ────────────────────────────────────────────────── */

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export default async function RestaurantOSPage({
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
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="ro-hero">
          <div>
            <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>{locale === 'de' ? 'GASTRONOMIE-BETRIEBSSYSTEM' : 'HOSPITALITY OPERATIONS SYSTEM'}</p>
            <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              {locale === 'de' ? <>Bestellungen laufen.<br />Personal nicht.</> : <>Orders move.<br />Staff doesn&apos;t.</>}
            </h1>
            <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              {locale === 'de'
                ? 'QR-Bestellung, Küchenweiterleitung, Rechnungsteilung und Zahlung, alles in einem einfachen System. Keine App für Gäste. Kein Tablet für das Personal.'
                : 'QR ordering, kitchen routing, bill splitting and payments, all in one simple system. No app for guests. No tablet for staff.'}
            </p>
            <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {(locale === 'de'
                ? ['Volle QR-Speisekarte mit Tischbestellung', 'Bestellung erscheint sofort in der Küche', 'Rechnung geteilt, wie die Gäste es wollen', 'Auf Ihrer eigenen Domain installiert']
                : ['Full QR menu with table ordering', 'Order appears instantly in the kitchen', 'Bill split however the table wants it', 'Installed on your own domain']
              ).map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="https://www.restaurant-os.de" target="_blank" rel="noopener noreferrer" className="ro-cta-primary"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }}
                >{locale === 'de' ? 'System ansehen →' : 'View system →'}</a>
              <Link href="/contact?system=restaurant-os" className="ro-cta-secondary"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}
                >{locale === 'de' ? 'Demo anfragen →' : 'Request demo →'}</Link>
            </div>
          </div>
          <div className="mp-img-wrap mp-hero-2" style={{ borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}>
            <Image
              src="/images/systems/restaurant-os/hero1.png"
              alt={locale === 'de' ? 'Gast bestellt per QR-Code vom Tisch, Speisekarte auf dem Handy geöffnet' : 'Guest ordering via QR code from the table, menu open on their phone'}
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'DAS PASSIERT JEDEN SERVICE' : 'THIS HAPPENS EVERY SERVICE'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Dasselbe Rufen. Jeden Abend.' : 'The same shouting. Every night.'}</h2>
            <div className="ro-grid-2">
              {(locale === 'de' ? [
                { label: 'DER RUF NACH DEM KELLNER', text: 'Der Tisch will bestellen. Der Kellner ist am anderen Ende des Raums. Ein Wink, ein Ruf, ein paar Minuten Wartezeit, bevor die Bestellung überhaupt aufgenommen wird.' },
                { label: 'DIE HANDGESCHRIEBENE BESTELLUNG', text: 'Die Bestellung wird auf einen Block geschrieben. Zur Küche getragen. Ein Gericht falsch gehört, ein Sonderwunsch vergessen. Der Fehler zeigt sich erst, wenn der Teller am Tisch steht.' },
                { label: 'DIE RECHNUNG AM ENDE', text: 'Sechs Gäste, eine Rechnung, keine klare Aufteilung. Jemand rechnet auf dem Handy nach. Der Kellner wartet. Der nächste Tisch wartet auch.' },
                { label: 'DIE GEDRUCKTE SPEISEKARTE', text: 'Ein Gericht ist aus. Die Karte sagt etwas anderes. Der Kellner erklärt es an jedem Tisch erneut, den ganzen Abend über.' },
              ] : [
                { label: 'THE WAVE FOR THE WAITER', text: "The table wants to order. The waiter is across the room. A wave, a call out, a few minutes of waiting before the order is even taken." },
                { label: 'THE HANDWRITTEN ORDER', text: "The order is written on a pad. Carried to the kitchen. One dish misheard, one modification forgotten. The mistake only shows up when the plate reaches the table." },
                { label: 'THE BILL AT THE END', text: "Six guests, one bill, no clear split. Someone works it out on their phone. The waiter waits. The next table waits too." },
                { label: 'THE PRINTED MENU', text: "One dish is out. The menu still lists it. The waiter explains it at every table, all night." },
              ]).map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${AMBER}` }}>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE EINE BESTELLUNG DERZEIT LÄUFT' : 'HOW AN ORDER MOVES RIGHT NOW'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Jede Übergabe ist ein Ort, an dem Bestellungen sich ändern können.' : 'Every handoff is a place where an order can change.'}</h2>
            <div className="ro-flow">
              {(locale === 'de' ? [
                { step: '01', label: 'Gast winkt', note: 'Wartet auf freie Aufmerksamkeit' },
                { step: '02', label: 'Kellner notiert', note: 'Handschriftlich, per Hand' },
                { step: '03', label: 'Zettel zur Küche', note: 'Getragen, nicht gesendet' },
                { step: '04', label: 'Küche liest', note: 'Handschrift, Annahmen' },
                { step: '05', label: 'Rechnung am Tisch', note: 'Von Hand aufgeteilt' },
              ] : [
                { step: '01', label: 'Guest waves', note: 'Waiting for free attention' },
                { step: '02', label: 'Waiter notes', note: 'Handwritten, by hand' },
                { step: '03', label: 'Ticket to kitchen', note: 'Carried, not sent' },
                { step: '04', label: 'Kitchen reads', note: 'Handwriting, assumptions' },
                { step: '05', label: 'Bill at table', note: 'Split by hand' },
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
                  {locale === 'de' ? 'Der Gast scannt den QR-Code am Tisch. Die Bestellung ist sofort in der Küche.' : 'The guest scans the QR code at the table. The order is in the kitchen instantly.'}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  {locale === 'de'
                    ? 'Keine App-Installation. Der Gast öffnet die vollständige Speisekarte im Browser, passt Artikel an und bestellt vom eigenen Handy. Die Bestellung erscheint sofort auf dem Küchenbildschirm, mit Tisch und Position, kein Weitersagen, kein Zettel.'
                    : 'No app install. The guest opens the full menu in the browser, customises items and orders from their own phone. The order appears instantly on the kitchen screen, with table and position, no relay, no paper.'}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginTop: '1rem' }}>
                  {locale === 'de'
                    ? 'Wenn die Rechnung kommt, zahlen Gäste bequem, alleine, gleichmäßig geteilt oder nach Sitzplatz. Das System läuft neben der bestehenden Kasse, nichts muss am ersten Tag umgestellt werden.'
                    : 'When the bill arrives, guests pay easily, solo, split equally, or by seat. The system runs alongside the existing till, nothing needs to switch over on day one.'}
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${AMBER}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{locale === 'de' ? 'WAS AUTOMATISCH LÄUFT' : 'WHAT RUNS AUTOMATICALLY'}</p>
                {(locale === 'de'
                  ? ['QR-Speisekarte, immer aktuell, kein Neudruck', 'Bestellung, direkt vom Tisch zur Küche', 'Küchenweiterleitung, ohne Zettel, ohne Rufen', 'Rechnungsteilung, wie die Gäste es wollen', 'Zahlung, integriert, neben der bestehenden Kasse']
                  : ['QR menu, always current, no reprinting', 'Order, straight from the table to the kitchen', 'Kitchen routing, no paper, no shouting', 'Bill splitting, however the table wants it', 'Payment, integrated, alongside the existing till']
                ).map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: AMBER, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE EINE BESTELLUNG LÄUFT' : 'HOW AN ORDER MOVES'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>{locale === 'de' ? 'Vom Scan am Tisch bis zur bezahlten Rechnung.' : 'From the scan at the table to the paid bill.'}</h2>
            <Reveal style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {(locale === 'de' ? [
                { num: '01', title: 'QR scannen',    desc: 'Gast scannt den QR-Code am Tisch. Öffnet die vollständige Speisekarte im Browser. Keine App nötig.' },
                { num: '02', title: 'Bestellen',     desc: 'Speisekarte durchsehen, Artikel anpassen und Bestellung vom Handy aufgeben.' },
                { num: '03', title: 'Küche erhält',  desc: 'Bestellung erscheint sofort in der Küche. Kein Weitersagen, kein Schreien, keine verpassten Artikel.' },
                { num: '04', title: 'Zubereiten',    desc: 'Ihr Team bereitet zu und serviert pünktlich. Personal konzentriert sich auf Service, nicht auf Koordination.' },
                { num: '05', title: 'Bezahlen',      desc: 'Rechnung ist fertig. Gäste zahlen bequem, alleine, gleichmäßig geteilt oder nach Sitzplatz.' },
              ] : [
                { num: '01', title: 'Scan QR',  desc: 'Guest scans the QR code on the table. Opens the full menu in the browser. No app install needed.' },
                { num: '02', title: 'Order',    desc: 'Browse the menu, customise items and place the order from any phone.' },
                { num: '03', title: 'Kitchen',  desc: 'Order appears in the kitchen instantly. No relay, no shouting, no missed items.' },
                { num: '04', title: 'Prepare',  desc: 'Your team prepares and serves on time. Staff focus on service, not coordination.' },
                { num: '05', title: 'Payment',  desc: 'Bill is ready. Guests pay easily, solo, shared equally, or split by seat.' },
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
                src={locale === 'de' ? '/images/systems/restaurant-os/card/restaurant-os-de.png' : '/images/systems/restaurant-os/card/restaurant-os-en.png'}
                alt={locale === 'de' ? 'RestaurantOS im Betrieb, QR-Bestellung, Küchenansicht und Zahlung' : 'RestaurantOS in operation, QR ordering, kitchen view and payment'}
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WAS SICH NACH DER INSTALLATION VERÄNDERT' : 'WHAT CHANGES AFTER INSTALLATION'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>{locale === 'de' ? 'Der Service ändert sich nicht. Wie Bestellungen ankommen, schon.' : 'Service does not change. How orders arrive does.'}</h2>
            <div style={{ background: BORDER, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{locale === 'de' ? 'VORHER' : 'BEFORE'}</p></div>
                <div style={{ padding: '14px 28px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{locale === 'de' ? 'NACHHER' : 'AFTER'}</p></div>
              </div>
              {(locale === 'de' ? [
                { before: 'Gast winkt, wartet auf den Kellner', after: 'Gast scannt und bestellt direkt vom Tisch' },
                { before: 'Bestellzettel handschriftlich zur Küche getragen', after: 'Bestellung erscheint sofort auf dem Küchenbildschirm' },
                { before: 'Speisekarte gedruckt, veraltet sobald ein Gericht ausgeht', after: 'Speisekarte digital, immer aktuell' },
                { before: 'Rechnung am Tisch von Hand aufgeteilt', after: 'Rechnung geteilt, wie die Gäste es wollen' },
              ] : [
                { before: 'Guest waves, waits for the waiter', after: 'Guest scans and orders directly from the table' },
                { before: 'Order ticket carried to the kitchen by hand', after: 'Order appears instantly on the kitchen screen' },
                { before: 'Menu printed, outdated the moment a dish runs out', after: 'Menu digital, always current' },
                { before: 'Bill split by hand at the table', after: 'Bill split however the table wants it' },
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

        {/* 7. SEE THE SYSTEM */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'DAS SYSTEM IM EINSATZ' : 'SEE THE SYSTEM'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Vom Tisch bis zur Küche, in echten Momenten.' : 'From the table to the kitchen, in real moments.'}</h2>
            <div className="ro-grid-3">
              {[
                { src: '/images/systems/restaurant-os/pain/p1.png', capDe: 'Bestellung vom Tisch', capEn: 'Ordering from the table' },
                { src: '/images/systems/restaurant-os/pain/p2.png', capDe: 'Küchenansicht in Echtzeit', capEn: 'Kitchen view in real time' },
                { src: '/images/systems/restaurant-os/pain/p3.png', capDe: 'Rechnung und Zahlung', capEn: 'Bill and payment' },
              ].map(shot => (
                <div key={shot.src} style={{ background: '#141414' }}>
                  <Image
                    src={shot.src}
                    alt={locale === 'de' ? shot.capDe : shot.capEn}
                    width={800}
                    height={600}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', padding: '14px 18px', margin: 0, letterSpacing: '0.05em' }}>{locale === 'de' ? shot.capDe : shot.capEn}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. WHAT HAPPENS NEXT */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE ES WEITERGEHT' : 'WHAT HAPPENS NEXT'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Vom ersten Gespräch bis zum ersten Service mit dem System.' : 'From the first conversation to the first service running on the system.'}</h2>
            <div className="ro-grid-2">
              {(locale === 'de' ? [
                { num: '01', title: 'Kurzes Gespräch',       desc: 'Wir erfahren mehr über das Restaurant, Tischanzahl, Küchenablauf, aktuelle Kasse und wo der Druck am größten ist.' },
                { num: '02', title: 'Speisekarte übernommen', desc: 'Ihre Speisekarte wird digitalisiert und im System eingerichtet, Preise, Kategorien, Sonderwünsche.' },
                { num: '03', title: 'System konfiguriert',    desc: 'RestaurantOS wird auf Ihrer Domain installiert, Branding und Farben angepasst, neben Ihrer bestehenden Kasse.' },
                { num: '04', title: 'Ab dem ersten Service',  desc: 'Gäste scannen und bestellen, Personal konzentriert sich auf den Tisch, nicht auf die Koordination.' },
              ] : [
                { num: '01', title: 'Short conversation', desc: 'We learn about the restaurant, table count, kitchen flow, current till and where the pressure is greatest.' },
                { num: '02', title: 'Menu onboarded',     desc: 'Your menu is digitised and set up in the system, prices, categories, modifications.' },
                { num: '03', title: 'System configured',  desc: 'RestaurantOS installed on your domain, branding and colours matched, alongside your existing till.' },
                { num: '04', title: 'Running from service one', desc: 'Guests scan and order, staff focus on the table, not on coordination.' },
              ]).map(item => (
                <div key={item.num} style={{ background: '#141414', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '40px', color: `${AMBER}30`, letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1 }}>{item.num}</p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ConnectedSystems systems={[
          { slug: 'taxkontrol',  name: 'TaxKontrol',  description: locale === 'de' ? 'Umsatzfluss und Steuerposition sehen.' : 'See revenue flow and tax position.', href: '/systems/taxkontrol' },
          { slug: 'handwerk-os', name: 'HandwerkOS',  description: locale === 'de' ? 'Aufträge und Rechnungsbewegung verfolgen.' : 'Track jobs and invoice movement.', href: '/systems/handwerk-os' },
          { slug: 'praxis-os',   name: 'PraxisOS',     description: locale === 'de' ? 'Terminbuchung und Kundenkommunikation.' : 'Booking and customer communication.', href: '/systems/praxis-os' },
        ]} locale={locale} />

        {/* 9. FAQ */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '2rem' }}>{locale === 'de' ? 'HÄUFIG GEFRAGT' : 'COMMONLY ASKED'}</p>
            <div className="ro-grid-2">
              {(locale === 'de' ? [
                { q: 'Kann ich meine eigene Domain nutzen?', a: 'Ja. Das System wird auf Ihrer Domain installiert. Kein Maxpromo-Branding ist sichtbar.' },
                { q: 'Kann ich Barzahlungen beibehalten?',   a: 'Ja. QR-Bestellungen und Kartenzahlung laufen parallel zu Ihrem bestehenden Kassensystem. Nichts muss sofort umgestellt werden.' },
                { q: 'Müssen die Mitarbeiter geschult werden?', a: 'Kaum. Das System ist für Restaurantmitarbeiter entwickelt, nicht für IT-Fachkräfte. Die meisten Teams sind in einem 20-Minuten-Walkthrough einsatzbereit.' },
                { q: 'Kann ich die Lieferfunktion später hinzufügen?', a: 'Ja. Liefermodul, Reservierungen und Loyalty-Programme können nach der Installation aktiviert werden.' },
              ] : [
                { q: 'Can I use my own domain?', a: 'Yes. The system is installed on your domain. No Maxpromo branding is visible.' },
                { q: 'Can I keep cash payments?', a: 'Yes. QR ordering and card payments run alongside your existing till. Nothing needs to switch over on day one.' },
                { q: 'Do staff need training?', a: 'Minimal. The system is built for restaurant teams, not IT. Most teams are operational in a 20-minute walkthrough.' },
                { q: 'Can I add delivery later?', a: 'Yes. Delivery module, reservations, and loyalty can be activated after installation.' },
              ]).map(item => (
                <div key={item.q} style={{ background: '#141414', padding: '32px' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '10px' }}>{item.q}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. CTA */}
        <section style={{ background: CARD, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'DEMO ANFRAGEN' : 'REQUEST A DEMO'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>{locale === 'de' ? 'Sehen Sie das System für Ihr Restaurant.' : 'See the system working for your restaurant.'}</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px', marginBottom: '2.5rem' }}>
              {locale === 'de'
                ? 'Erzählen Sie uns von Ihrem Restaurant und Ihrer aktuellen Kasse. Wir zeigen das Live-System, konfiguriert für Ihre Speisekarte und Ihr Tischlayout.'
                : 'Tell us about your restaurant and your current till. We walk through the live system, configured for your menu and table layout.'}
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="https://www.restaurant-os.de" target="_blank" rel="noopener noreferrer" className="ro-cta-primary"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }}
                >{locale === 'de' ? 'System ansehen →' : 'View system →'}</a>
              <Link href="/contact?system=restaurant-os" className="ro-cta-secondary"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}
                >{locale === 'de' ? 'Demo anfragen →' : 'Request demo →'}</Link>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '20px 0 0' }}>
              {locale === 'de' ? '// Kein Commitment · Antwort innerhalb von 24 Stunden' : '// No commitment · Reply within 24 hours'}
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
