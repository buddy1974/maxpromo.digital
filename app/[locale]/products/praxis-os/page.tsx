import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Reveal } from '@/components/ui/Reveal'
import { ConnectedSystems } from '@/components/systems/ConnectedSystems'
import { PraxisContactForm } from './PraxisContactForm'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'PraxisOS | Terminbuchung, Laborbefunde & Patientenportal'
    : 'PraxisOS | Online Booking, Lab Results & Patient Portal'
  const description = isDE
    ? 'Terminbuchungen, Laborbefunde und Patientennachrichten automatisch verwaltet — DSGVO-konforme Akten, Schluss mit der Telefonkette.'
    : 'Patient bookings, lab results and follow-ups managed automatically — GDPR-compliant records, no more turning communication into a phone chain.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/products/praxis-os`,
      languages: {
        de: 'https://www.maxpromo.digital/de/products/praxis-os',
        en: 'https://www.maxpromo.digital/en/products/praxis-os',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/products/praxis-os`,
    },
  }
}

const BLUE   = '#60A5FA'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .px-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .px-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  .px-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .px-grid-2 { grid-template-columns: 1fr; }
    .px-flow   { flex-direction: column; }
    .px-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
`

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export default async function PraxisOSPage({
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
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="px-hero">
          <div>
            <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>{locale === 'de' ? 'PRAXISBETRIEB-SYSTEM' : 'PRACTICE OPERATIONS SYSTEM'}</p>
            <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              {locale === 'de' ? <>Schluss mit der Telefonkette<br />für die Patientenkommunikation.</> : <>Stop turning patient communication<br />into a phone chain.</>}
            </h1>
            <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              {locale === 'de' ? 'Terminbuchungen, Erinnerungen und Patientennachrichten — automatisch verwaltet. Ihr Personal konzentriert sich auf die Patienten.' : 'PraxisOS keeps patient bookings, lab results, records and follow-ups connected in one practice flow — without changing how the clinical team already works.'}
            </p>
            <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {(locale === 'de' ? ['Patienten buchen online — kein Telefonanruf nötig', 'Laborbefunde direkt im Patientenportal', 'DSGVO-konforme Akten sofort abrufbar', 'Automatische Terminbestätigungen'] : ['Patients book online — no phone required', 'Lab results in patient portal directly', 'GDPR-compliant records retrievable instantly', 'Automated appointment confirmations']).map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
              ))}
            </div>
            <a href="#walkthrough" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
              onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}>{locale === 'de' ? 'Walkthrough planen →' : 'Schedule walkthrough →'}</a>
          </div>
          <div className="mp-img-wrap mp-hero-2" style={{ borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}>
            <Image
              src={locale === 'de' ? '/images/systems/praxis-os/card/praxis-os-de.png' : '/images/systems/praxis-os/card/praxis-os-en.png'}
              alt={locale === 'de' ? 'Praxisempfang — Patientenbuchung und Terminverwaltung' : 'Medical practice reception — patient booking and appointment management workflow'}
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
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Dieselben Telefonanrufe. Jeden Tag.' : 'The same phone calls. Every day.'}</h2>
            <div className="px-grid-2">
              {(locale === 'de' ? [
                { label: 'DER BUCHUNGSANRUF', text: 'Patient ruft an, um zu buchen. Die Rezeption prüft den Kalender. Rückruf zur Bestätigung des freien Slots. Patient ruft zwei Tage vor dem Termin erneut an. Das Telefon klingelt wieder.' },
                { label: 'DIE LABORBEFUNDE', text: 'Laborbefunde kommen an. Patient ruft nach. Rezeption nimmt eine Nachricht auf. Arzt ist beim Patienten. Arzt ruft zurück wenn verfügbar. Patient hat den Anruf verpasst. Patient ruft erneut an.' },
                { label: 'DIE DOPPELBUCHUNG', text: 'Zwei Patienten für denselben Slot über verschiedene Kanäle geplant. Am Morgen entdeckt. Ein Termin verschoben. Ein Patient kurzfristig kontaktiert. Ein Termin hinterlässt einen leeren Slot.' },
                { label: 'DIE DSGVO-ANFRAGE', text: 'Patient fordert Zugang zu seinen Unterlagen. Akten existieren in verschiedenen Systemen — teils digital, teils auf Papier. Zusammenstellen der vollständigen Akte dauert zwei Tage. Frist ist sieben.' },
              ] : [
                { label: 'THE BOOKING CALL', text: "Patient calls to book. Reception checks the calendar. Calls back to confirm the slot is still available. Patient calls again two days before the appointment to confirm. The phone rings again." },
                { label: 'THE LAB RESULTS', text: "Lab results arrive. Patient calls to ask. Reception takes a message. Doctor is with a patient. Doctor calls back when available. Patient missed the call. Patient calls again." },
                { label: 'THE DOUBLE BOOKING', text: "Two patients scheduled for the same slot through different channels. Discovered the morning of. One appointment moved. One patient contacted last minute. One appointment leaves an empty slot." },
                { label: 'THE GDPR REQUEST', text: "Patient requests access to their records. Records exist across different systems — some digital, some paper. Compiling the complete file takes two days. Deadline is seven." },
              ]).map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${BLUE}` }}>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE PATIENTENKOMMUNIKATION DERZEIT LÄUFT' : 'HOW PATIENT COMMUNICATION MOVES RIGHT NOW'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Jede Weiterleitung ist ein Ort, an dem Zeit verloren geht und Informationen übersehen werden können.' : 'Every relay is a place where time is lost and information can be missed.'}</h2>
            <div className="px-flow">
              {(locale === 'de' ? [
                { step: '01', label: 'Patient ruft an',    note: 'Für Buchung oder Ergebnis' },
                { step: '02', label: 'Rezeption nimmt auf',  note: 'Nachricht oder Kalenderprüfung' },
                { step: '03', label: 'Arzt informiert',  note: 'Wenn verfügbar' },
                { step: '04', label: 'Rückruf',         note: 'Wenn Patient verfügbar' },
                { step: '05', label: 'Patient ruft an',    note: 'Erneut, wenn verpasst' },
              ] : [
                { step: '01', label: 'Patient calls',    note: 'For booking or results' },
                { step: '02', label: 'Reception takes',  note: 'Message or calendar check' },
                { step: '03', label: 'Doctor informed',  note: 'When available' },
                { step: '04', label: 'Callback',         note: 'If patient is available' },
                { step: '05', label: 'Patient calls',    note: 'Again, if missed' },
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
                  {locale === 'de' ? 'PraxisOS entfernt das Telefon aus der Mitte der Patientenkommunikation.' : 'PraxisOS removes the phone from the middle of patient communication.'}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  {locale === 'de' ? 'Patienten buchen online. Bestätigung kommt automatisch. Laborbefunde hochgeladen und im Patientenportal sichtbar. DSGVO-konforme Akten sofort abrufbar. Das Praxisteam konzentriert sich auf klinische Arbeit — nicht auf Koordinationsanrufe.' : 'Patients book online. Confirmation arrives automatically. Lab results uploaded and visible in the patient portal. GDPR-compliant records retrievable instantly. The practice team focuses on clinical work — not coordination calls.'}
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${BLUE}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{locale === 'de' ? 'WAS SICH VERÄNDERT' : 'WHAT CHANGES'}</p>
                {(locale === 'de' ? ['Online-Buchung — kein Telefonanruf zur Terminvereinbarung', 'Automatische Bestätigung — Patient sofort benachrichtigt', 'Laborbefunde im Patientenportal — keine Rückrufkette', 'DSGVO-Akten — sofort abrufbar, nicht auf Anfrage zusammengestellt', 'Terminerinnerungen — automatisch, ohne Mitarbeiterbeteiligung'] : ['Online booking — no phone call required to schedule', 'Automatic confirmation — patient notified instantly', 'Lab results in patient portal — no callback chain', 'GDPR records — instantly retrievable, not compiled on request', 'Appointment reminders — automatic, no staff involvement']).map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: BLUE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE EIN PATIENTENWEG VERLÄUFT' : 'HOW A PATIENT JOURNEY MOVES'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>{locale === 'de' ? 'Von der ersten Buchung bis zur Nachsorge — verbunden.' : 'From the first booking to the follow-up — connected.'}</h2>
            <Reveal style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {(locale === 'de' ? [
                { num: '01', title: 'Patient bucht online',     desc: 'Wählt Termintyp und verfügbaren Slot. Bestätigung automatisch gesendet. Kein Empfangspersonal für Standardbuchungen erforderlich.' },
                { num: '02', title: 'Besuch abgeschlossen',      desc: 'Klinische Notizen im Patientendatensatz erfasst. Kein Papier. Keine Übertragung in ein zweites System.' },
                { num: '03', title: 'Laborbefunde hochgeladen',  desc: 'Ergebnisse kommen an und werden direkt ins Patientenportal eingefügt. Patient benachrichtigt. Keine Rückrufkette erforderlich.' },
                { num: '04', title: 'Patient greift auf Portal zu', desc: 'Patient sieht Ergebnisse, Terminhistorie und alle Praxiskommunikationen. DSGVO-konform. Von jedem Gerät zugänglich.' },
                { num: '05', title: 'Nachsorge geplant',          desc: 'Folgetermin bei Bedarf vom Portal aus gebucht. Erinnerung automatisch vor dem Termin gesendet.' },
              ] : [
                { num: '01', title: 'Patient books online',   desc: 'Selects appointment type and available slot. Confirmation sent automatically. No reception involvement required for standard bookings.' },
                { num: '02', title: 'Visit completed',         desc: 'Clinical notes recorded in the patient record. No paper. No transcription to a second system.' },
                { num: '03', title: 'Lab results uploaded',    desc: 'Results arrive and are added to the patient portal directly. Patient notified. No callback chain required.' },
                { num: '04', title: 'Patient accesses portal', desc: 'Patient sees results, appointment history and any practice communications. GDPR-compliant. Accessible from any device.' },
                { num: '05', title: 'Follow-up scheduled',    desc: 'Follow-up appointment booked from the portal if needed. Reminder sent automatically before the appointment date.' },
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
                src="/images/systems/praxis-os/card/praxis-os-de.png"
                alt={locale === 'de' ? 'PraxisOS im Betrieb — Patientenportal, Terminverwaltung und Laborbefunde' : 'PraxisOS in operation — patient portal, appointment management and lab results'}
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
                { before: 'Patienten rufen an — Rezeption koordiniert',        after: 'Patienten buchen online — Bestätigung automatisch'    },
                { before: 'Laborbefunde über Telefonrückrufkette',              after: 'Laborbefunde im Patientenportal — keine Rückrufe'    },
                { before: 'Doppelbuchungen aus verschiedenen Kanälen',          after: 'Einzelner Kalender — keine Terminierungskonflikte'   },
                { before: 'DSGVO-Akten auf Anfrage über Tage zusammengestellt', after: 'DSGVO-Akten sofort abrufbar'                        },
                { before: 'Terminerinnerungen per Telefon',                     after: 'Automatische Erinnerungen — keine Mitarbeiterbeteiligung' },
              ] : [
                { before: 'Patients call to book — reception coordinates', after: 'Patients book online — confirmation automatic'     },
                { before: 'Lab results via phone callback chain',           after: 'Lab results in patient portal — no callbacks'    },
                { before: 'Double bookings from multiple channels',         after: 'Single calendar — no scheduling conflicts'       },
                { before: 'GDPR records compiled on request over days',    after: 'GDPR records retrievable instantly'              },
                { before: 'Appointment reminders made by phone',           after: 'Automatic reminders — no staff involvement'      },
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
            <div className="px-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${BLUE}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>{locale === 'de' ? 'Ein echter Praxisablauf — von der Buchung bis zum Patientenportal.' : 'A real practice workflow — from booking to patient portal.'}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>{locale === 'de' ? 'Der Walkthrough umfasst Online-Buchung, Terminverwaltung, Laborbefunde-Upload, Patientenportalzugang und DSGVO-Aktenabfrage. Das vollständige System — keine Feature-Präsentation.' : 'The walkthrough covers online booking, appointment management, lab result upload, patient portal access, and GDPR record retrieval. The full system — not a feature presentation.'}</p>
              </div>
              <div style={{ background: CARD, padding: '40px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>{locale === 'de' ? 'WIE ES WEITERGEHT' : 'WHAT HAPPENS NEXT'}</p>
                {(locale === 'de' ? [
                  { num: '01', t: 'Kurzes Gespräch',    d: 'Wir erfahren mehr über die Praxis — Fachgebiet, Teamgröße, aktueller Buchungs- und Aktenfluss.' },
                  { num: '02', t: 'Workflow analysiert', d: 'Wir kartieren, wie Patienten derzeit durch die Praxis fließen, bevor wir etwas konfigurieren.' },
                  { num: '03', t: 'System konfiguriert', d: 'PraxisOS für das spezifische Fachgebiet eingerichtet — Buchungstypen, Portalzugang, DSGVO-Einstellungen.' },
                  { num: '04', t: 'Mit Buchung starten', d: 'Beginnen Sie mit Online-Terminplanung. Portal, Laborbefunde und Akten hinzufügen, wenn das Team vertraut wird.' },
                ] : [
                  { num: '01', t: 'Short conversation', d: 'We learn about the practice — specialty, team size, current booking and record flow.' },
                  { num: '02', t: 'Workflow reviewed',  d: 'We map how patients currently move through the practice before configuring anything.' },
                  { num: '03', t: 'System configured',  d: 'PraxisOS set up for the specific specialty — booking types, portal access, GDPR settings.' },
                  { num: '04', t: 'Start with booking', d: 'Begin with online scheduling. Add portal, lab results and records as the team gets comfortable.' },
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
          { slug: 'care-os',       name: 'CareOS',       description: locale === 'de' ? 'Verbundene Pflegeabläufe.' : 'Connected care workflows.',         href: '/products/care-os'       },
          { slug: 'taxkontrol',    name: 'TaxKontrol',   description: locale === 'de' ? 'Finanzielle Übersicht.' : 'Financial visibility.',             href: '/products/taxkontrol'    },
          { slug: 'real-estate-os', name: 'RealEstateOS', description: locale === 'de' ? 'Pipeline- und Workflow-Management.' : 'Pipeline and workflow management.', href: '/products/real-estate-os'},
        ]} locale={locale} />

        {/* 9. CTA */}
        <section id="walkthrough" style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WALKTHROUGH PLANEN' : 'SCHEDULE A WALKTHROUGH'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>{locale === 'de' ? 'Sehen Sie PraxisOS für Ihr Fachgebiet in Aktion.' : 'See PraxisOS working for your specialty.'}</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>{locale === 'de' ? 'Erzählen Sie uns von der Praxis. Wir führen durch das Live-System und zeigen, wie PraxisOS zur bestehenden Interaktion zwischen Patienten und Klinikteam passt.' : 'Tell us about the practice. We walk through the live system and show how PraxisOS fits the way patients and the clinical team already interact.'}</p>
            <PraxisContactForm locale={locale} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>{locale === 'de' ? '// Kein Commitment · Antwort innerhalb von 24 Stunden · Deutsche Gesundheitsstandards · DSGVO-konform' : '// No commitment · Reply within 24 hours · German healthcare standards · DSGVO compliant'}</p>
          </div>
        </section>

      </main>
    </>
  )
}
