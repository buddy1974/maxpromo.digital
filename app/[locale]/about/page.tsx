import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about')
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  }
}

const mono    = { fontFamily: 'var(--font-mono)' } as const
const sans    = { fontFamily: 'var(--font-body)' } as const

const SECTION_PADDING = 'clamp(4.5rem, 8vw, 8.75rem) 2rem'

interface StackRow {
  id: 'r1' | 'r2' | 'r3'
  tools: ReadonlyArray<string>
}

const STACK_ROWS: ReadonlyArray<StackRow> = [
  { id: 'r1', tools: ['Claude AI', 'OpenAI', 'n8n', 'Make', 'Zapier', 'LangChain', 'Airtable'] },
  { id: 'r2', tools: ['Supabase', 'Neon', 'Vercel', 'Render', 'Next.js', 'Cloudflare', 'Resend', 'Twilio'] },
  { id: 'r3', tools: ['HubSpot', 'Notion', 'Slack', 'Xero', 'Google Workspace', 'Shopify', 'Zendesk'] },
]

const VALUE_REFS = [
  { num: '01', id: 'v1' as const },
  { num: '02', id: 'v2' as const },
  { num: '03', id: 'v3' as const },
  { num: '04', id: 'v4' as const },
  { num: '05', id: 'v5' as const },
  { num: '06', id: 'v6' as const },
]

const WHY_KEYS  = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const
const HOW_STEPS = ['s1', 's2', 's3', 's4'] as const

export default async function AboutPage() {
  const t       = await getTranslations('about')
  const tValues = await getTranslations('about.values')
  const tWhy    = await getTranslations('about.why')
  const tHow    = await getTranslations('about.how')

  const todayList = t.raw('todayList') as string[]

  return (
    <main style={{ background: 'var(--color-bg)' }}>

      {/* Hero */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ marginBottom: '20px', maxWidth: '44rem' }}>
            {t('title')}
          </h1>
          <p style={{ ...sans, fontSize: '19px', color: 'var(--color-text-secondary)', maxWidth: '44rem', lineHeight: 1.75 }}>
            {t('intro')}
          </p>
        </div>
      </section>

      {/* Story, years of real systems work */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto', display: 'grid', gap: '3rem' }} className="grid-cols-1 lg:grid-cols-2">
          <div>
            <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('storyEyebrow')}
            </p>
            <h2 style={{ marginBottom: '20px' }}>
              {t('storyTitle')}
            </h2>
            <p style={{ ...sans, fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              {t('storyBody')}
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'flex-start', paddingTop: '2.5rem' }}>
            {['Joomla', 'WordPress', 'Drupal', 'TYPO3', 'phpMyAdmin', 'MySQL', 'WAMP', 'XAMPP', '.htaccess', 'PHP', 'Hostinger', 'GoDaddy', 'A2 Hosting', 'CI/CD', 'Git', 'Next.js', 'Supabase', 'n8n', 'Claude AI'].map((tag) => (
              <span key={tag} style={{ ...mono, fontSize: '12px', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '5px 12px', letterSpacing: '0.03em', borderRadius: '6px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Transformation */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('transformEyebrow')}
          </p>
          <h2 style={{ marginBottom: '20px' }}>
            {t('transformTitle')}
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
            {t('transformBody')}
          </p>
        </div>
      </section>

      {/* Today */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('todayEyebrow')}
          </p>
          <h2 style={{ marginBottom: '2.5rem' }}>
            {t('todayTitle')}
          </h2>
          <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {todayList.map((item, i) => (
              <div key={i} className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: 'var(--brand-text-secondary)', flexShrink: 0, ...mono, fontSize: '13px' }}>→</span>
                <p style={{ ...sans, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why / pain points */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3.5rem' }}>
            <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('whyEyebrow')}
            </p>
            <p style={{ ...sans, fontSize: '19px', color: 'var(--color-text-secondary)', lineHeight: 1.75, marginBottom: '8px' }}>
              {t('whyLead')}
            </p>
          </div>
          <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_KEYS.map((key) => (
              <div key={key} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: 'var(--brand-text-secondary)', flexShrink: 0, ...mono, fontSize: '15px', paddingTop: '2px' }}>✕</span>
                <p style={{ ...sans, fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {tWhy(key)}
                </p>
              </div>
            ))}
          </div>
          <p style={{ ...mono, fontSize: '15px', color: 'var(--brand-text-secondary)', marginTop: '2rem', letterSpacing: '0.03em' }}>
            → {t('whyClosing')}
          </p>
        </div>
      </section>

      {/* How we work */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3.5rem' }}>
            <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('howEyebrow')}
            </p>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((step, idx) => (
              <div key={step} style={{ background: 'var(--color-bg)', padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
                <span style={{ ...mono, fontSize: '48px', fontWeight: 700, color: 'rgba(249,115,22,0.10)', position: 'absolute', top: '16px', right: '24px', lineHeight: 1 }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="h-card" style={{ marginBottom: '10px', position: 'relative' }}>
                  {tHow(`${step}Title`)}
                </h3>
                <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.75, position: 'relative', margin: 0 }}>
                  {tHow(`${step}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we work with */}
      <section style={{ background: 'var(--color-bg)', padding: '4.5rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
            {t('forEyebrow')}
          </p>
          <p style={{ ...sans, fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.8, margin: 0 }}>
            {t('forList')}
          </p>
        </div>
      </section>

      {/* Principles */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3.5rem' }}>
            <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('principleEyebrow')}
            </p>
            <h2>
              {t('principleTitle')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {VALUE_REFS.map((v) => (
              <div key={v.num} className="card">
                <h3 className="h-card" style={{ color: 'var(--brand-text-secondary)', marginBottom: '8px' }}>
                  {tValues(`${v.id}Title`)}
                </h3>
                <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>
                  {tValues(`${v.id}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section style={{ background: 'var(--color-bg)', padding: '3.5rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {t('stackEyebrow')}
          </p>
          <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            {t('stackTitle')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {STACK_ROWS.map((row) => (
              <div key={row.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {row.tools.map((tool) => (
                  <span key={tool} style={{ ...mono, fontSize: '12px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-section)', border: '1px solid var(--color-border)', padding: '5px 12px', letterSpacing: '0.03em', borderRadius: '6px' }}>
                    {tool}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2 style={{ marginBottom: '20px' }}>
            {t('ctaTitle')}
          </h2>
          <p style={{ ...sans, fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', lineHeight: 1.75 }}>
            {t('ctaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link href="/contact" className="btn btn-primary">
              {t('ctaPrimary')}
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
