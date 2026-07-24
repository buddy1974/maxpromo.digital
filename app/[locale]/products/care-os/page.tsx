import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Reveal } from '@/components/ui/Reveal'
import { ConnectedSystems } from '@/components/systems/ConnectedSystems'
import { CareContactForm } from './CareContactForm'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'CareOS | Pflegepläne, EMAR & Familienportal verbunden'
    : 'CareOS | Care Plans, EMAR & Family Portal Connected'
  const description = isDE
    ? 'CareOS verbindet Pflegepläne, Medikamentenakten, Compliance und Familienkommunikation in einem operativen Ablauf — ohne zusätzlichen Prozess für Ihr Team.'
    : 'CareOS keeps care plans, medication records, compliance and family communication connected in one operational flow — without adding process to your team.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/products/care-os`,
      languages: {
        de: 'https://www.maxpromo.digital/de/products/care-os',
        en: 'https://www.maxpromo.digital/en/products/care-os',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/products/care-os`,
    },
  }
}

const ACCENT = '#818CF8'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .co-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .co-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  .co-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .co-grid-2 { grid-template-columns: 1fr; }
    .co-flow   { flex-direction: column; }
    .co-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
`

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export default async function CareOSPage({
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
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="co-hero">
          <div>
            <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>{locale === 'de' ? 'PFLEGE-VERWALTUNGSSYSTEM' : 'CARE MANAGEMENT SYSTEM'}</p>
            <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              {locale === 'de' ? <>Pflege erbracht. Akte aktualisiert.<br />Familie informiert. Ohne drei separate Systeme.</> : <>Care delivered. Record updated.<br />Family notified. Without three separate systems.</>}
            </h1>
            <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              {locale === 'de' ? 'CareOS verbindet Pflegepläne, Medikamentenakten, Compliance und Familienkommunikation in einem operativen Ablauf — ohne Prozesse zu einem ohnehin belasteten Team hinzuzufügen.' : 'CareOS keeps care plans, medication records, compliance and family communication connected in one operational flow — without adding process to an already stretched team.'}
            </p>
            <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {(locale === 'de' ? ['Digitale Pflegepläne in Echtzeit aktualisiert', 'EMAR-Medikamentenakten live', 'CQC-Compliance kontinuierlich verfolgt', 'Familienportal — nach jedem Besuch aktualisiert'] : ['Digital care plans updated in real time', 'EMAR medication records live', 'CQC compliance tracked continuously', 'Family portal — updated after every visit']).map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
              ))}
            </div>
            <a href="#walkthrough" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
              onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}>{locale === 'de' ? 'Walkthrough planen →' : 'Schedule walkthrough →'}</a>
          </div>
          <div className="mp-img-wrap mp-hero-2" style={{ borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}>
            <Image
              src={locale === 'de' ? '/images/systems/care-os/card/care-os-de.png' : '/images/systems/care-os/card/care-os-en.png'}
              alt={locale === 'de' ? 'Pflegekraft dokumentiert einen Pflegebesuch — Akten in Echtzeit aktualisiert' : 'Caregiver documenting a care visit — records updated in real time'}
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
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Dieselben Verwaltungslücken. Jede Schicht.' : 'The same administration gaps. Every shift.'}</h2>
            <div className="co-grid-2">
              {(locale === 'de' ? [
                { label: 'PAPIER-PFLEGEPLÄNE', text: 'Der Pflegeplan liegt auf Papier vor. Nach dem Besuch aktualisiert — wenn Zeit ist. Die neueste Version ist möglicherweise nicht diejenige, mit der die nächste Pflegekraft ankommt. Pläne weichen von der Realität ab.' },
                { label: 'SCHICHTENDE-PROTOKOLLIERUNG', text: 'Medikament verabreicht. EMAR am Schichtende aktualisiert — aus dem Gedächtnis. Vorfälle am nächsten Morgen protokolliert. Die Lücke zwischen Verabreichung und Akte schafft Compliance-Risiko.' },
                { label: 'FAMILIENTELEFONATE', text: 'Familienangehöriger ruft an, um nach dem gestrigen Besuch zu fragen. Die Information befindet sich in einem Ordner oder System, auf das die Person, die den Anruf entgegennimmt, vom Pflegesetting aus nicht zugreifen kann.' },
                { label: 'COMPLIANCE-ORDNER', text: 'CQC-Inspektion steht bevor. Akten existieren — aber in mehreren Ordnern, Systemen und Formaten. Die Vorbereitung einer Inspektion dauert Tage, die für die Pflege genutzt werden sollten.' },
              ] : [
                { label: 'PAPER CARE PLANS', text: "Care plan is on paper. Updated after the visit — if there is time. The most recent version may not be the one the next carer arrives with. Plans drift from reality." },
                { label: 'END-OF-SHIFT LOGGING', text: "Medication administered. EMAR updated at the end of the shift — from memory. Incidents recorded the next morning. The gap between delivery and record creates compliance risk." },
                { label: 'FAMILY PHONE CALLS', text: "Family member calls to ask about yesterday's visit. The information is in a folder or a system that the person answering the phone cannot access from the care setting." },
                { label: 'COMPLIANCE FOLDERS', text: "CQC inspection approaching. Records exist — but across multiple folders, systems, and formats. Preparing for an inspection takes days that should be spent on care." },
              ]).map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${ACCENT}` }}>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE PFLEGEAKTEN DERZEIT FLIESSEN' : 'HOW CARE RECORDS MOVE RIGHT NOW'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>{locale === 'de' ? 'Jede Lücke zwischen Erbringung und Dokumentation ist ein Compliance-Risiko.' : 'Every gap between delivery and documentation is a compliance risk.'}</h2>
            <div className="co-flow">
              {(locale === 'de' ? [
                { step: '01', label: 'Pflege erbracht', note: 'Vor Ort oder zu Hause' },
                { step: '02', label: 'Papierakte',   note: 'Nach dem Besuch ausgefüllt' },
                { step: '03', label: 'EMAR-Update',    note: 'Schichtende, aus dem Gedächtnis' },
                { step: '04', label: 'Familienupdate',  note: 'Telefonanruf wenn erinnert' },
                { step: '05', label: 'Compliance',     note: 'Ordner für Inspektion zusammengestellt' },
              ] : [
                { step: '01', label: 'Care delivered', note: 'On site or in home' },
                { step: '02', label: 'Paper record',   note: 'Filled after visit' },
                { step: '03', label: 'EMAR update',    note: 'End of shift, from memory' },
                { step: '04', label: 'Family update',  note: 'Phone call if remembered' },
                { step: '05', label: 'Compliance',     note: 'Folders compiled for inspection' },
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
                  {locale === 'de' ? 'CareOS verbindet den Besuch mit der Akte. Die Akte mit der Familie. Die Akte mit der Compliance.' : 'CareOS connects the visit to the record. The record to the family. The record to compliance.'}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  {locale === 'de' ? 'Pflegepläne sind digital und aktuell. Medikamentenakten zum Verabreichungszeitpunkt aktualisiert — nicht am Schichtende. Familienportal zeigt die neueste Besuchszusammenfassung. CQC-Compliance kontinuierlich verfolgt — nicht vor einer Inspektion zusammengestellt.' : 'Care plans are digital and current. Medication records updated at administration time — not at end of shift. Family portal shows the latest visit summary. CQC compliance tracked continuously — not assembled before an inspection.'}
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{locale === 'de' ? 'WAS VERBUNDEN WIRD' : 'WHAT CONNECTS'}</p>
                {(locale === 'de' ? ['Pflegeplan — digital, aktuell, für das gesamte Team zugänglich', 'EMAR — zum Medikamentierungszeitpunkt aktualisiert, nicht Schichtende', 'Familienportal — Besuchszusammenfassung nach jeder Pflegeleistung', 'CQC-Compliance — kontinuierlich verfolgt, nicht vor Audits zusammengestellt', 'KI-Assistent — bearbeitet Routineanfragen und ersten Kundenaufnahme'] : ['Care plan — digital, current, accessible to the whole team', 'EMAR — updated at medication time, not end of shift', 'Family portal — visit summary after every care delivery', 'CQC compliance — tracked continuously, not compiled before audits', 'AI assistant — handles routine inquiries and initial client intake']).map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: ACCENT, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WIE PFLEGE LÄUFT' : 'HOW CARE MOVES'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>{locale === 'de' ? 'Von der ersten Anfrage bis zum dokumentierten Besuch — verbunden.' : 'From new client inquiry to documented visit — connected.'}</h2>
            <Reveal style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {(locale === 'de' ? [
                { num: '01', title: 'Neue Kundenanfrage',     desc: 'KI-Assistent sammelt erste Informationen und erstellt das Kundenprofil. Passende Pflegekraft automatisch basierend auf Verfügbarkeit und Kundenbedürfnissen zugeordnet.' },
                { num: '02', title: 'Pflegeplan erstellt',    desc: 'Digitaler Pflegeplan erstellt und mit dem gesamten Pflegeteam geteilt. In Echtzeit aktualisiert, wenn sich die Kundensituation ändert.' },
                { num: '03', title: 'Besuch abgeschlossen',   desc: 'Pflege vor Ort erbracht. Akte sofort aktualisiert — nicht am Schichtende. Medikament verabreicht und zum Verabreichungszeitpunkt im EMAR protokolliert.' },
                { num: '04', title: 'Familie benachrichtigt', desc: 'Besuchszusammenfassung automatisch nach jeder Pflegeleistung ans Familienportal gesendet. Familie kann den neuesten Status sehen, ohne das Büro anzurufen.' },
                { num: '05', title: 'Compliance aufrechterhalten', desc: 'CQC-Compliance kontinuierlich verfolgt. Keine Vorbereitung vor Inspektionen erforderlich. Akten sind aktuell und jederzeit zugänglich.' },
              ] : [
                { num: '01', title: 'New client inquiry',    desc: 'AI assistant collects initial information and creates the client profile. Suitable carer matched automatically based on availability and client needs.' },
                { num: '02', title: 'Care plan created',     desc: 'Digital care plan built and shared with the whole care team. Updated in real time as the client situation changes.' },
                { num: '03', title: 'Visit completed',       desc: 'Care delivered on site. Record updated immediately — not at end of shift. Medication administered and logged in EMAR at the time of administration.' },
                { num: '04', title: 'Family notified',       desc: 'Visit summary sent to family portal automatically after every care delivery. Family can see the latest status without calling the office.' },
                { num: '05', title: 'Compliance maintained', desc: 'CQC compliance tracked continuously. No pre-inspection assembly required. Records are current and accessible whenever they are needed.' },
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
                src="/images/systems/care-os/card/care-os-de.png"
                alt={locale === 'de' ? 'CareOS im Betrieb — Pflegeplan, EMAR-Akten und Familienportal verbunden' : 'CareOS in operation — care plan, EMAR records and family portal connected'}
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
                { before: 'Papier-Pflegepläne, nachträglich aktualisiert',     after: 'Digitale Pläne, aktuell und für das Team zugänglich' },
                { before: 'EMAR am Schichtende aus dem Gedächtnis aktualisiert', after: 'EMAR zum Medikamentierungszeitpunkt protokolliert — sofort' },
                { before: 'Familie ruft das Büro für ein Update an',            after: 'Familie sieht den neuesten Besuch über das Portal'      },
                { before: 'Compliance vor Inspektionen zusammengestellt',       after: 'Compliance kontinuierlich verfolgt — immer aktuell'     },
                { before: 'Vorfallberichte am nächsten Tag geschrieben',        after: 'Vorfälle zum Zeitpunkt ihres Auftretens dokumentiert'   },
              ] : [
                { before: 'Paper care plans, updated after the fact',    after: 'Digital plans, current and accessible to the team' },
                { before: 'EMAR updated at end of shift from memory',    after: 'EMAR logged at medication time — immediately'       },
                { before: 'Family calls the office for an update',       after: 'Family sees the latest visit via the portal'        },
                { before: 'Compliance assembled before inspections',     after: 'Compliance tracked continuously — always current'   },
                { before: 'Incident reports written the next day',       after: 'Incidents documented at the time they occur'        },
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'SYSTEM SEHEN · WIE ES WEITERGEHT' : 'SEE THE SYSTEM · WHAT HAPPENS NEXT'}</p>
            <div className="co-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${ACCENT}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>{locale === 'de' ? 'Ein echter Pflegeablauf — von der Aufnahme bis zur Besuchsakte.' : 'A real care workflow — from intake to visit record.'}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>{locale === 'de' ? 'Der Walkthrough umfasst den vollständigen Pflegeweg — Pflegeplanerstellung, Besuchsprotokollierung, EMAR-Protokollierung, Familienportal und Compliance-Ansicht. Das System im Einsatz für einen echten Betrieb.' : 'The walkthrough covers the full care journey — care plan creation, visit recording, EMAR logging, family portal, and compliance view. The system working for a real supported living operation.'}</p>
              </div>
              <div style={{ background: CARD, padding: '40px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>{locale === 'de' ? 'WIE ES WEITERGEHT' : 'WHAT HAPPENS NEXT'}</p>
                {(locale === 'de' ? [
                  { num: '01', t: 'Kurzes Gespräch',    d: 'Wir erfahren mehr über die Organisation — Teamgröße, Pflegetypen, aktueller Aktenführungsansatz.' },
                  { num: '02', t: 'Workflow analysiert', d: 'Wir kartieren, wie Besuche, Akten und Compliance derzeit funktionieren, bevor wir etwas konfigurieren.' },
                  { num: '03', t: 'System konfiguriert', d: 'CareOS für den spezifischen Pflegetyp eingerichtet — Pflegeplanvorlagen, Compliance-Anforderungen, Familienportal.' },
                  { num: '04', t: 'Klein starten',       d: 'Beginnen Sie mit einem Pflegetyp oder Team. Erweitern, wenn das Team mit dem neuen Ablauf vertraut wird.' },
                ] : [
                  { num: '01', t: 'Short conversation', d: 'We learn about the organisation — team size, care types, current record-keeping approach.' },
                  { num: '02', t: 'Workflow reviewed',  d: 'We map how visits, records and compliance currently work before configuring anything.' },
                  { num: '03', t: 'System configured',  d: 'CareOS set up for the specific care type — care plan templates, compliance requirements, family portal.' },
                  { num: '04', t: 'Start small',        d: 'Begin with one care type or team. Expand as the team gets comfortable with the new flow.' },
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
          { slug: 'praxis-os',  name: 'PraxisOS',   description: locale === 'de' ? 'Abstimmung von Patienten- und Pflegeabläufen.' : 'Patient and care workflow alignment.',    href: '/products/praxis-os'  },
          { slug: 'taxkontrol', name: 'TaxKontrol', description: locale === 'de' ? 'Operative Finanzen im Blick.' : 'Keep operational finances visible.',      href: '/products/taxkontrol' },
          { slug: 'handwerk-os', name: 'HandwerkOS', description: locale === 'de' ? 'Inspiration für Feldteam-Prozesse.' : 'Field-team process inspiration.',        href: '/products/handwerk-os'},
        ]} locale={locale} />

        {/* 9. CTA */}
        <section id="walkthrough" style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>{locale === 'de' ? 'WALKTHROUGH PLANEN' : 'SCHEDULE A WALKTHROUGH'}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>{locale === 'de' ? 'Sehen Sie CareOS in einer echten Pflegeumgebung.' : 'See CareOS working in a real care environment.'}</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>{locale === 'de' ? 'Erzählen Sie uns von der Organisation. Wir führen durch das Live-System und zeigen, wie CareOS zur spezifischen Art passt, wie Ihr Team Pflege erbringt und dokumentiert.' : 'Tell us about the organisation. We walk through the live system and show how CareOS fits the specific way your team already delivers and records care.'}</p>
            <CareContactForm locale={locale} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>{locale === 'de' ? '// Kein Commitment · Antwort innerhalb von 24 Stunden · DSGVO-konform' : '// No commitment · Reply within 24 hours · DSGVO compliant'}</p>
          </div>
        </section>

      </main>
    </>
  )
}
