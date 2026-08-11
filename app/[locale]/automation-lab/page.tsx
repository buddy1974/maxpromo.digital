import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import AutomationCard from '@/components/AutomationCard'
import Link from 'next/link'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Operations-Engineering-Referenz' : 'Operations Engineering Reference',
    description: isDE
      ? 'Achtzehn produktionsreife operative Runtimes, Entscheidungssysteme, Koordinationsmotoren und Kommunikationsabläufe, die wir auf den Betrieb unserer Kunden aufsetzen. Konzipiert, installiert und betrieben von Maxpromo.'
      : 'Eighteen production-grade operational runtimes, decision systems, coordination engines and communications operations we deploy on top of client operations. Architected, installed, and run by Maxpromo.',
  }
}

/* ─── LOCALE HELPER ───────────────────────────────────────── */
function t(locale: string, de: string, en: string): string {
  return locale === 'de' ? de : en
}

interface Automation {
  title: string
  description: string
  tools: string[]
}

interface Category {
  heading: string
  automations: Automation[]
}

/**
 * Categories reframed from capability buckets into operational domains.
 *
 * Old wording ("AI Agents" / "Workflow Automation" / "Content & Social")
 * read as a freelancer's skill stack. The new headings name the kind of
 * work each runtime performs inside the operation: decisions, coordination,
 * communications. Same eighteen runtimes underneath, different surface
 * vocabulary so the page reads as engineering reference, not a feature
 * menu.
 */
function getCategories(locale: string): Category[] {
  return [
    {
      heading: t(locale, 'Entscheidungssysteme', 'Decision Systems'),
      automations: [
        {
          title: t(locale, 'Lead-Qualifizierungs-Agent', 'Lead Qualification Agent'),
          description: t(locale,
            'Bewertet eingehende Leads anhand Ihres ICP, vergibt einen Score, reichert sie mit Daten an und leitet vielversprechende Leads mit einer personalisierten Zusammenfassung an den Vertrieb weiter.',
            'Evaluates inbound leads against your ICP, scores them, enriches with data, and routes hot leads to sales with a personalised summary.'),
          tools: ['Claude AI', 'HubSpot', 'Apollo.io', 'Slack'],
        },
        {
          title: t(locale, 'KI-Kundensupport-Agent', 'Customer Support AI Agent'),
          description: t(locale,
            'Beantwortet Anfragen rund um die Uhr mithilfe Ihrer Wissensdatenbank. Übernimmt Tier-1-Support, bearbeitet FAQs und eskaliert komplexe Fälle mit vollständigem Gesprächskontext.',
            'Answers queries 24/7 using your knowledge base. Handles tier-1 support, processes FAQs, escalates complex issues with full conversation context.'),
          tools: ['Claude AI', 'Zendesk', 'Slack', 'n8n'],
        },
        {
          title: t(locale, 'Vertragsprüfungs-Agent', 'Contract Review Agent'),
          description: t(locale,
            'Liest Verträge, extrahiert Schlüsselklauseln, markiert unübliche Bedingungen und erstellt eine strukturierte Zusammenfassung für die rechtliche oder kaufmännische Prüfung.',
            'Reads contracts, extracts key clauses, flags non-standard terms, and produces a structured summary for legal or commercial review.'),
          tools: ['Claude AI', 'Google Drive', 'Notion', 'Slack'],
        },
        {
          title: t(locale, 'Recherche- und Briefing-Agent', 'Research & Briefing Agent'),
          description: t(locale,
            'Recherchiert bei einem Thema oder Unternehmen eigenständig mehrere Quellen, fasst die Erkenntnisse zusammen und liefert in wenigen Minuten ein strukturiertes Briefing-Dokument.',
            'Given a topic or company, autonomously researches multiple sources, synthesises findings, and delivers a structured briefing document in minutes.'),
          tools: ['Claude AI', 'Notion', 'Resend', 'n8n'],
        },
        {
          title: t(locale, 'Angebots-Generierungs-Agent', 'Proposal Generation Agent'),
          description: t(locale,
            'Nimmt ein Kunden-Briefing entgegen und entwirft ein formatiertes Angebot mit Leistungsumfang, Zeitplan und Preisen, bereit zur menschlichen Prüfung und zum Versand.',
            'Takes a client brief and drafts a formatted proposal including scope, timeline, and pricing, ready for human review and send.'),
          tools: ['Claude AI', 'HubSpot', 'Google Docs', 'Make'],
        },
        {
          title: t(locale, 'Interner Wissensassistent', 'Internal Knowledge Assistant'),
          description: t(locale,
            'KI-Assistent, trainiert auf Ihren internen Dokumenten, SOPs und Richtlinien. Mitarbeiter stellen Fragen in normaler Sprache und erhalten sofort präzise Antworten.',
            'AI assistant trained on your internal docs, SOPs, and policies. Staff ask questions in plain English and get accurate answers instantly.'),
          tools: ['Claude AI', 'Notion', 'Confluence', 'Slack'],
        },
      ],
    },
    {
      heading: t(locale, 'Koordinations- und Prozessmotoren', 'Coordination & Process Engines'),
      automations: [
        {
          title: t(locale, 'Rechnungsverarbeitungs-Automatisierung', 'Invoice Processing Automation'),
          description: t(locale,
            'Extrahiert Rechnungsdaten aus E-Mail-Anhängen, gleicht sie mit Bestellungen ab, bucht sie in Ihrem Buchhaltungssystem und markiert Ausnahmen.',
            'Extracts invoice data from email attachments, validates against purchase orders, posts to your accounting system, flags exceptions.'),
          tools: ['Claude AI', 'Xero', 'Make', 'Gmail'],
        },
        {
          title: t(locale, 'CRM-Lead-Routing-Automatisierung', 'CRM Lead Routing Automation'),
          description: t(locale,
            'Leitet eingehende Leads anhand definierter Kriterien an den richtigen Ansprechpartner weiter, mit automatischer Aufgabenerstellung und personalisierter E-Mail-Benachrichtigung.',
            'Routes inbound leads to the right rep based on criteria, with automatic task creation and personalised email notification.'),
          tools: ['HubSpot', 'Salesforce', 'Zapier', 'Slack'],
        },
        {
          title: t(locale, 'Meeting-Zusammenfassungs-Workflow', 'Meeting Summarisation Workflow'),
          description: t(locale,
            'Transkribiert Meetings, extrahiert Entscheidungen und Aufgaben, versendet strukturierte Zusammenfassungen und erstellt Aufgaben in Ihrem Projektmanagement-Tool.',
            'Transcribes meetings, extracts decisions and action items, sends structured summaries, and creates tasks in your project management tool.'),
          tools: ['Whisper AI', 'Notion', 'Slack', 'n8n'],
        },
        {
          title: t(locale, 'Mitarbeiter-Onboarding-Automatisierung', 'Employee Onboarding Automation'),
          description: t(locale,
            'Löst bei Neueinstellung eine vollständige Onboarding-Sequenz aus, Bereitstellung, Willkommens-E-Mails, Dokumentenanfragen, Schulungszuweisungen, Führungskräfte-Benachrichtigungen.',
            'Triggers a full onboarding sequence on new hire creation, provisioning, welcome emails, document requests, training assignments, manager notifications.'),
          tools: ['BambooHR', 'Slack', 'Google Workspace', 'Make'],
        },
        {
          title: t(locale, 'Reporting- und Analyse-Pipeline', 'Reporting & Analytics Pipeline'),
          description: t(locale,
            'Zieht nach Zeitplan Daten aus mehreren Quellen, wendet Formatierungsregeln an und verteilt fertige Berichte automatisch an die Stakeholder.',
            'Pulls data from multiple sources on a schedule, applies formatting rules, and distributes finished reports to stakeholders automatically.'),
          tools: ['Supabase', 'Google Sheets', 'Claude AI', 'Resend'],
        },
        {
          title: t(locale, 'Terminbuchungs-Automatisierung', 'Appointment Booking Automation'),
          description: t(locale,
            'Ermöglicht Interessenten, Termine direkt über Ihre Website zu buchen, prüft Verfügbarkeit, sendet Bestätigungen, trägt ins CRM ein und startet Vorbereitungssequenzen für das Gespräch.',
            'Lets prospects book calls from your site, checks availability, sends confirmations, adds to CRM, and triggers pre-call preparation sequences.'),
          tools: ['Calendly', 'HubSpot', 'Make', 'Gmail'],
        },
      ],
    },
    {
      heading: t(locale, 'Kommunikationsabläufe', 'Communications Operations'),
      automations: [
        {
          title: t(locale, 'Social-Media-Content-Pipeline', 'Social Media Content Pipeline'),
          description: t(locale,
            'Erstellt markengerechte Inhalte aus Briefings, formatiert sie für jede Plattform, plant die Veröffentlichung, überwacht das Engagement und liefert wöchentliche Leistungsberichte.',
            'Generates on-brand content from briefs, formats for each platform, schedules publishing, monitors engagement, and delivers weekly performance reports.'),
          tools: ['Claude AI', 'Buffer', 'Airtable', 'n8n'],
        },
        {
          title: t(locale, 'Blog- und SEO-Content-Automatisierung', 'Blog & SEO Content Automation'),
          description: t(locale,
            'Recherchiert Keywords, verfasst Langform-Beiträge in Ihrer Markenstimme, optimiert für SEO und veröffentlicht nach Zeitplan, vollständig durchgängig.',
            'Researches keywords, drafts long-form posts in your brand voice, optimises for SEO, and publishes on schedule, end to end.'),
          tools: ['Claude AI', 'WordPress', 'Airtable', 'Make'],
        },
        {
          title: t(locale, 'E-Mail-Marketing-Automatisierung', 'Email Marketing Automation'),
          description: t(locale,
            'Verhaltensbasierte E-Mail-Sequenzen, die sich an den Aktionen der Empfänger orientieren. Willkommens-Flows, Nurture-Sequenzen, Reaktivierungskampagnen, personalisiert von Claude.',
            'Behaviour-triggered email sequences that adapt based on recipient actions. Welcome flows, nurture sequences, re-engagement campaigns, personalised by Claude.'),
          tools: ['Claude AI', 'Mailchimp', 'HubSpot', 'Make'],
        },
        {
          title: t(locale, 'Marken-Monitoring- und Reaktions-Agent', 'Brand Monitoring & Response Agent'),
          description: t(locale,
            'Überwacht Erwähnungen auf sozialen Plattformen und Bewertungsseiten, klassifiziert die Stimmung, entwirft Antwortvorschläge und alarmiert das Team bei wichtigen Erwähnungen.',
            'Monitors mentions across social platforms and review sites, classifies sentiment, drafts response suggestions, and alerts the team to high-priority mentions.'),
          tools: ['Claude AI', 'Airtable', 'Slack', 'n8n'],
        },
        {
          title: t(locale, 'Video- und Content-Wiederverwertung', 'Video & Content Repurposing'),
          description: t(locale,
            'Nimmt ein Video-Transkript oder einen Blogbeitrag und wandelt ihn in LinkedIn-Posts, X-Threads, E-Mail-Newsletter und Kurzform-Skripte um.',
            'Takes a video transcript or blog post and repurposes it into LinkedIn posts, X threads, email newsletters, and short-form scripts.'),
          tools: ['Claude AI', 'Notion', 'Buffer', 'Make'],
        },
        {
          title: t(locale, 'KI-Produktbeschreibungen', 'Product Description AI'),
          description: t(locale,
            'Erstellt SEO-optimierte Produktbeschreibungen in Ihrer Markenstimme im großen Maßstab. Produktdaten rein, veröffentlichungsfertiger Text für jede SKU im Katalog raus.',
            'Generates SEO-optimised product descriptions in your brand voice at scale. Input product data, output publish-ready copy for every SKU in your catalogue.'),
          tools: ['Claude AI', 'Shopify', 'Airtable', 'Make'],
        },
      ],
    },
  ]
}

const mono = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans = { fontFamily: 'var(--font-inter)' } as const

export default async function AutomationLabPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const CATEGORIES = getCategories(locale)

  const statLabels = [
    t(locale, '18 Runtimes', '18 runtimes'),
    t(locale, '6 Branchen im produktiven Einsatz', '6 verticals in production'),
    t(locale, 'Typische Installation · 1–4 Wochen', 'Typical install · 1–4 weeks'),
  ]

  return (
    <main style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <section style={{ background: 'var(--color-bg)', padding: 'clamp(4.5rem, 8vw, 8.75rem) 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t(locale, '// Referenz-Bibliothek', '// Reference Library')}
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            {t(locale, 'Operations-Engineering-Referenz', 'Operations Engineering Reference')}
          </h1>
          <p style={{ ...sans, fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '46rem', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            {t(locale,
              'Achtzehn produktionsreife Runtimes, die wir auf dem Betrieb unserer Kunden aufsetzen. Jede davon ist ein System, das wir konzipiert, installiert haben und weiterhin betreiben, kein Katalog von Standard-Bausteinen zur Auswahl.',
              'Eighteen production-grade runtimes we deploy on top of client operations. Each one is a system we have architected, installed, and continue to operate, not a catalogue of off-the-shelf widgets to choose from.')}
          </p>
          {/* Operational signal bar, names what's in production, not what we're built on */}
          <div
            style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0', borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg-section)' }}
          >
            {statLabels.map((stat, i, arr) => (
              <span
                key={stat}
                style={{
                  ...mono,
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  letterSpacing: '0.06em',
                  padding: '10px 20px',
                  borderRight: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Category sections */}
      {CATEGORIES.map((cat, catIdx) => (
        <section
          key={cat.heading}
          style={{
            background: catIdx % 2 === 0 ? 'var(--color-bg-section)' : 'var(--color-bg)',
            padding: 'clamp(4.5rem, 8vw, 8.75rem) 2rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
            <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>
              {`// ${cat.heading}`}
            </p>
            <h2
              style={{
                ...grotesk,
                fontWeight: 700,
                fontSize: '30px',
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.01em',
                marginBottom: '2rem',
                paddingBottom: '16px',
                borderBottom: '2px solid var(--color-primary)',
                display: 'inline-block',
              }}
            >
              {cat.heading}
            </h2>
            <div
              style={{ display: 'grid', gap: '16px' }}
              className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
              {cat.automations.map((a) => (
                <AutomationCard key={a.title} {...a} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section style={{ background: 'var(--color-bg-section)', padding: 'clamp(4.5rem, 8vw, 8.75rem) 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t(locale, '// Eine individuelle Ebene entwickeln', '// Architect a custom layer')}
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            {t(locale, 'Brauchen Sie eine Runtime, die nicht in der Referenz steht?', "Need a runtime that isn't in the reference?")}
          </h2>
          <p style={{ ...sans, fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            {t(locale,
              'Jeder Betrieb hat mindestens eine Ebene, die nicht in ein Standardmuster passt. Wir entwickeln maßgeschneiderte Runtimes von Grund auf, installiert, betrieben, wiederherstellbar.',
              "Every operation has at least one layer that doesn't fit a standard pattern. We architect bespoke runtimes from the ground up, installed, operated, recoverable.")}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link href="/contact" className="btn btn-primary">
              {t(locale, 'Kontakt aufnehmen →', 'Contact us →')}
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              {t(locale, 'Mit einem Architekten sprechen', 'Talk to an architect')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
