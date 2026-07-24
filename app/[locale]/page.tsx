import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'
import { LandingEngine } from '@/components/landing/LandingEngine'
import Hero from '@/components/Hero'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { getLatestPosts } from '@/lib/blog/posts'
import { PainSlider } from '@/components/ui/PainSlider'
import { PainCards } from '@/components/homepage/PainCards'
import { SystemsTabs } from '@/components/homepage/SystemsTabs'
import { ProofMetrics } from '@/components/homepage/ProofMetrics'
import type { ProofMetric } from '@/components/homepage/ProofMetrics'
import { TeamTrust } from '@/components/homepage/TeamTrust'
import { FaqAccordion } from '@/components/homepage/FaqAccordion'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'Maxpromo Digital | KI-Business-Systeme aus Essen'
    : 'Maxpromo Digital | AI Business Systems Built in Essen'
  const description = isDE
    ? 'Wir modernisieren veraltete Websites, automatisieren Workflows und installieren KI-gestützte Betriebssysteme für Restaurants, Handwerk, Praxen und mehr.'
    : 'We modernize legacy websites, automate workflows, and install AI-powered operating systems for restaurants, trades, medical practices and more.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}`,
      languages: {
        de: 'https://www.maxpromo.digital/de',
        en: 'https://www.maxpromo.digital/en',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}`,
    },
  }
}

/* ─── HELPERS ─── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', lineHeight: 1.1, marginBottom: 0 }}>
      {children}
    </h2>
  )
}

/* ─── PAGE ─── */

export default async function HomePage() {
  const locale = await getLocale()

  // ── Showcase dispatch ─────────────────────────────────────────────────
  // Middleware stamps x-mp-mode + x-mp-slug for every request.
  // When a product domain hits this page (e.g. restaurant-os.de/),
  // render LandingEngine instead of the hub homepage.
  const h    = await headers()
  const mode = h.get('x-mp-mode')
  const slug = h.get('x-mp-slug')

  if (mode === 'showcase' && slug) {
    const data = getLandingData(slug, locale)
    if (!data) return notFound()
    return <LandingEngine data={data} />
  }
  // ── Hub homepage (unchanged below) ───────────────────────────────────

  const t            = await getTranslations('home')
  const tProcess     = await getTranslations('home.process')
  const tWhyUs       = await getTranslations('home.whyUs')
  const tProof       = await getTranslations('home.proof')
  const tSystemsTabs = await getTranslations('home.systemsTabs')
  const tLegacy      = await getTranslations('home.legacy')
  const tPhilosophy  = await getTranslations('home.philosophy')
  const tBlog        = await getTranslations('blog')

  const latestPosts = getLatestPosts(locale, 3)

  const WHY_REFS   = ['w1', 'w2', 'w3', 'w4'] as const
  const PROOF_REFS = ['p1', 'p2', 'p3'] as const
  const PROCESS_REFS = ['p1', 'p2', 'p3', 'p4', 'p5'] as const

  return (
    <>
      <link rel="preload" as="image" href="/images/homepage/hero-1.png" />
      <main>

      {/* 1, Hero (LOCKED) */}
      <Hero />

      {/* Pain Slider, rotating problem strip below hero */}
      <PainSlider />

      {/* 2, Pain Cards */}
      <PainCards />

      {/* 3, Proof strip */}
      <section data-section="proof" style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <SectionLabel>{tProof('eyebrow')}</SectionLabel>
              <SectionTitle>{tProof('title')}</SectionTitle>
            </div>
            <Link href="/case-studies" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
              {tProof('viewAll')}
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 12% 60%)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '44rem' }}>
            {tProof('subtitle')}
          </p>
          <ProofMetrics
            metrics={PROOF_REFS.map((id): ProofMetric => ({
              id,
              value:  tProof(`${id}Value`),
              label:  tProof(`${id}Label`),
              source: tProof(`${id}Source`),
            }))}
          />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 28%)', marginTop: '1rem', letterSpacing: '0.05em' }}>
            {tProof('note')}
          </p>
        </div>
      </section>

      {/* 4a, Legacy modernization */}
      <section data-section="legacy" style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ maxWidth: '52rem', marginBottom: '3rem' }}>
            <SectionLabel>{tLegacy('eyebrow')}</SectionLabel>
            <SectionTitle>{tLegacy('title')}</SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 12% 60%)', lineHeight: 1.75, marginTop: '1rem' }}>
              {tLegacy('subtitle')}
            </p>
          </div>
          <div style={{ display: 'grid', gap: '12px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {(['c1', 'c2', 'c3', 'c4', 'c5'] as const).map((id) => (
              <div key={id} style={{ background: 'hsl(240 12% 7%)', border: '1px solid hsl(40 30% 96% / 0.07)', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', margin: 0 }}>
                  {tLegacy(`${id}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'hsl(40 12% 50%)', lineHeight: 1.7, margin: 0 }}>
                  {tLegacy(`${id}Pain`)}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#F97316', lineHeight: 1.6, margin: 0, paddingTop: '8px', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
                  → {tLegacy(`${id}System`)}
                </p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, maxWidth: '52rem', margin: 0 }}>
              {tLegacy('closing')}
            </p>
            <Link
              href="/contact"
              className="shine"
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'hsl(240 14% 4%)', background: '#F97316', padding: '12px 24px', textDecoration: 'none', display: 'inline-block', borderRadius: '8px', flexShrink: 0 }}
            >
              {tLegacy('cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* 4, Systems tabs */}
      <section data-section="systems" style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div>
              <SectionLabel>{tSystemsTabs('eyebrow')}</SectionLabel>
              <SectionTitle>
                {tSystemsTabs('title')}{' '}
                <span style={{ color: '#F97316' }}>{tSystemsTabs('titleAccent')}</span>
              </SectionTitle>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 12% 65%)', marginTop: '10px', lineHeight: 1.7 }}>
                {tSystemsTabs('subtitle')}
              </p>
            </div>
            <Link href="/systems" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
              {tSystemsTabs('viewAll')} →
            </Link>
          </div>
          <SystemsTabs />
        </div>
      </section>

      {/* 4b, Max Agent Bureau Gateway */}
      <section id="agent-bureau" data-section="agent-bureau" style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ maxWidth: '56rem', marginBottom: '3rem' }}>
            <SectionLabel>{'// Max Agent Bureau'}</SectionLabel>
            <SectionTitle>
              {locale === 'de'
                ? <>Ein KI-Büro, das Arbeit vorbereitet-{' '}<span style={{ color: '#F97316' }}>nicht einfach nur antwortet.</span></>
                : <>An AI office that prepares work-{' '}<span style={{ color: '#F97316' }}>not just responds to it.</span></>}
            </SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 12% 60%)', lineHeight: 1.8, marginTop: '1rem', maxWidth: '48rem' }}>
              {locale === 'de'
                ? 'Agent Bureau prüft Abläufe, sammelt Informationen, bereitet Entscheidungen vor und legt kritische Aktionen zur Freigabe vor.'
                : 'Agent Bureau audits workflows, gathers information, prepares decisions, and submits critical actions for human approval.'}
            </p>
          </div>

          {/* Workflow infographic, Audit → Diagnose → Agent Team → Review (gate) → Execute → Log */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 42%)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {locale === 'de' ? 'Der Ablauf' : 'The workflow'}
          </p>
          <div style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden', marginBottom: '3rem' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
            {(locale === 'de'
              ? [
                  { name: 'Audit',      caption: 'Abläufe prüfen' },
                  { name: 'Diagnose',   caption: 'Engpässe finden' },
                  { name: 'Agent Team', caption: 'Aufgaben verteilen' },
                  { name: 'Review',     caption: 'Mensch gibt frei', gate: true },
                  { name: 'Execute',    caption: 'Aktion ausführen' },
                  { name: 'Log',        caption: 'Alles dokumentiert' },
                ]
              : [
                  { name: 'Audit',      caption: 'Scan workflows' },
                  { name: 'Diagnose',   caption: 'Find bottlenecks' },
                  { name: 'Agent Team', caption: 'Assign tasks' },
                  { name: 'Review',     caption: 'Human approves', gate: true },
                  { name: 'Execute',    caption: 'Run the action' },
                  { name: 'Log',        caption: 'Everything logged' },
                ]
            ).map((step, i, arr) => {
              const gate = 'gate' in step && step.gate
              return (
                <div key={step.name} style={{ background: gate ? 'rgba(249,115,22,0.07)' : 'hsl(240 12% 7%)', padding: '1.5rem 1.25rem', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '4px', padding: '3px 8px', flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {gate && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    )}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', margin: '0 0 4px 0', lineHeight: 1.25 }}>
                    {step.name}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: gate ? '#F97316' : 'hsl(40 12% 50%)', lineHeight: 1.55, margin: 0 }}>
                    {step.caption}
                  </p>
                  {i < arr.length - 1 && (
                    <span className="hidden lg:block" style={{ position: 'absolute', right: '-7px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(249,115,22,0.35)', fontSize: '13px', zIndex: 1 }} aria-hidden="true">
                      →
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Module cards, 5 items in 3-col grid */}
          <div style={{ display: 'grid', gap: '12px', marginBottom: '2.5rem' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {(locale === 'de'
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
            ).map((card) => (
              <div key={card.title} className="mp-card-hover" style={{ background: 'hsl(240 12% 7%)', border: '1px solid hsl(40 30% 96% / 0.07)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {card.key === 'audit'    && <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" /></>}
                    {card.key === 'waiting'  && <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
                    {card.key === 'approval' && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>}
                    {card.key === 'intake'   && <><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M9 13h6M9 17h4" /></>}
                    {card.key === 'shadow'   && <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>}
                  </svg>
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.3 }}>
                  {card.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'hsl(40 12% 55%)', lineHeight: 1.7, margin: 0 }}>
                  {card.body}
                </p>
              </div>
            ))}
          </div>

          {/* Trust badge, supervised mode */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: '10px', padding: '14px 20px', marginBottom: '2.5rem', maxWidth: '100%' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(40 20% 78%)', letterSpacing: '0.03em', lineHeight: 1.6, margin: 0 }}>
              {locale === 'de'
                ? 'Keine autonome Ausführung. Jede kritische Aktion bleibt freigabepflichtig.'
                : 'No autonomous execution. Every critical action requires human approval.'}
            </p>
          </div>

          {/* CTAs, gated: no external URLs on public homepage */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <Link
              href="/contact?system=agent-bureau"
              className="shine"
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#F97316', color: '#080808', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '8px', whiteSpace: 'nowrap' }}
            >
              {locale === 'de' ? 'Beratungsgespräch anfragen →' : 'Request Agent Bureau Consultation →'}
            </Link>
            <Link
              href="/automation-audit"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'hsl(40 30% 96%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '8px', border: '1px solid hsl(40 30% 96% / 0.18)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}
            >
              {locale === 'de' ? 'Business-Systeme Audit starten' : 'Start Business Systems Audit'}
            </Link>
          </div>

        </div>
      </section>

      {/* 5, Why Maxpromo */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem', maxWidth: '44rem' }}>
            <SectionLabel>{tWhyUs('eyebrow')}</SectionLabel>
            <SectionTitle>
              {tWhyUs('title')}{' '}
              <span style={{ color: '#F97316' }}>{tWhyUs('titleAccent')}</span>
            </SectionTitle>
          </div>
          <div style={{ display: 'grid', gap: '12px' }} className="grid-cols-1 sm:grid-cols-2">
            {WHY_REFS.map((id) => (
              <div
                key={id}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.07)',
                  borderRadius: '12px',
                  padding: '2rem 2.5rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: '#F97316', fontFamily: 'var(--font-mono)', fontSize: '16px', flexShrink: 0, paddingTop: '2px' }}>✓</span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    {tWhyUs(`${id}Title`)}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, margin: 0 }}>
                    {tWhyUs(`${id}Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6, Team trust */}
      <TeamTrust />

      {/* 6a, Philosophy */}
      <section data-section="philosophy" style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gap: '4rem' }} className="grid-cols-1 lg:grid-cols-2">
          <div>
            <SectionLabel>{tPhilosophy('eyebrow')}</SectionLabel>
            <SectionTitle>{tPhilosophy('title')}</SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 12% 60%)', lineHeight: 1.85, marginTop: '1.5rem', whiteSpace: 'pre-line' }}>
              {tPhilosophy('body')}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#F97316', marginTop: '2rem', letterSpacing: '0.04em' }}>
              → {tPhilosophy('closing')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
            {(['step1', 'step2', 'step3', 'step4', 'step5'] as const).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'hsl(240 12% 7%)', border: '1px solid hsl(40 30% 96% / 0.07)', borderRadius: '10px', padding: '18px 24px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '4px', padding: '3px 8px', flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.01em' }}>
                  {tPhilosophy(s)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7, How we work */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>{tProcess('processEyebrow')}</SectionLabel>
            <SectionTitle>{tProcess('processTitle')}</SectionTitle>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_REFS.map((id, i) => (
              <div key={id} style={{ background: 'hsl(240 12% 7%)', padding: '2rem 1.75rem', position: 'relative' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '48px', lineHeight: 1, marginBottom: '0.75rem', color: '#F97316' }}>
                  {tProcess(`${id}Num`)}
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(40 12% 50%)', background: 'hsl(240 10% 14%)', padding: '2px 7px', display: 'inline-block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                  {tProcess(`${id}Time`)}
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.3 }}>
                  {tProcess(`${id}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'hsl(40 12% 60%)', lineHeight: 1.7, margin: 0 }}>
                  {tProcess(`${id}Desc`)}
                </p>
                {i < PROCESS_REFS.length - 1 && (
                  <span className="hidden lg:block" style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(249,115,22,0.3)', fontSize: '14px', zIndex: 1 }}>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8, FAQ */}
      <FaqAccordion />

      {/* 9, Latest insights (only when posts exist) */}
      {latestPosts.length > 0 && (
        <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              <div>
                <SectionLabel>{tBlog('homepageEyebrow')}</SectionLabel>
                <SectionTitle>
                  {tBlog('homepageTitle')}{' '}
                  <span style={{ color: '#F97316' }}>{tBlog('homepageTitleAccent')}</span>
                </SectionTitle>
              </div>
              <Link href="/blog" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
                {tBlog('homepageViewAll')} →
              </Link>
            </div>
            <div style={{ display: 'grid', gap: '1.5rem' }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                  <article style={{ background: 'hsl(240 12% 7%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }} className="mp-card-hover">
                    {post.featuredImage && (
                      <div className="mp-img-wrap" style={{ position: 'relative', aspectRatio: '16/9' }}>
                        <Image src={post.featuredImage} alt={post.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      </div>
                    )}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {post.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {post.tags.map((tag) => (
                            <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', padding: '2px 8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'hsl(40 30% 96%)', lineHeight: 1.35, margin: 0 }}>
                        {post.title}
                      </h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                        {post.excerpt}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)', letterSpacing: '0.05em' }}>{post.publishedAt}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.05em' }}>{tBlog('readArticle')}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10, Final CTA */}
      <section style={{ background: 'hsl(240 14% 3%)', padding: '7rem 2rem', position: 'relative', overflow: 'hidden', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <SectionLabel>{t('finalCtaEyebrow')}</SectionLabel>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '1rem',
              marginTop: '0.5rem',
              lineHeight: 1.15,
            }}
          >
            {t('finalCtaTitle')}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'hsl(40 12% 55%)', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
            {t('finalCtaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Link href="/automation-audit" className="shine" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: '#F97316', padding: '16px 32px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px', boxShadow: '0 0 40px rgba(249,115,22,0.3)' }}>
              {t('finalCtaPrimary')}
            </Link>
            <Link href="/contact" className="glass" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '16px 32px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              {t('finalCtaSecondary')}
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 32%)', letterSpacing: '0.05em' }}>
            {t('finalCtaFootnote')}
          </p>
        </div>
      </section>

      </main>
    </>
  )
}
