'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export interface AuditResult {
  title?: string
  problem: string
  solution: string
  tools: string[]
  roi?: string
  complexity?: string
  timeline?: string
}

interface AuditResultsProps {
  results: AuditResult[]
  orgType: string
  company: string
  onEstimate?: () => void
}

const mono = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans = 'var(--font-inter)'

export default function AuditResults({ results, orgType, company, onEstimate }: AuditResultsProps) {
  const t = useTranslations('automationAudit.results')
  const handlePrint = () => window.print()

  const avgTimeline = results.some((r) => r.timeline)
    ? results.filter((r) => r.timeline)[0]?.timeline ?? t('statAvgTimelineFallback')
    : t('statAvgTimelineFallback')

  const stats = [
    { label: t('statOpportunities'), value: `${results.length}` },
    { label: t('statAvgTimeline'), value: avgTimeline },
    { label: t('statImplementation'), value: t('statImplementationValue') },
  ]

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '0 16px' }}>
      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          body { background: white !important; color: black !important; font-size: 12px; }
          .print-card { break-inside: avoid; background: #f9f9f9 !important; border: 1px solid #ddd !important; color: black !important; }
          .print-card * { color: black !important; }
          .print-header { background: #0A0A0A !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* ── Report Header ── */}
      <div
        className="print-header"
        style={{
          background: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '3px solid #F97316',
          padding: '40px 48px',
          marginBottom: '2px',
        }}
      >
        <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
          {t('reportLabel')}
        </p>
        <h1 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.04em', color: '#FFFFFF', marginBottom: '8px' }}>
          {company ? t('titlePrefix', { company }) : ''}{t('title')}
        </h1>
        <p style={{ fontFamily: sans, fontSize: '15px', color: '#666666', marginBottom: '32px' }}>
          {t('subtitle', {
            count: results.length,
            orgTypeSuffix: orgType ? t('orgTypeSuffix', { orgType }) : '',
          })}
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: '1 1 160px',
                padding: '20px 24px',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <p style={{ fontFamily: mono, fontSize: '10px', color: '#555555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                {stat.label}
              </p>
              <p style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '22px', color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Opportunity Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '2px' }}>
        {results.map((r, i) => (
          <div
            key={i}
            className="print-card"
            style={{
              background: '#0F0F0F',
              border: '1px solid rgba(255,255,255,0.07)',
              borderLeft: '4px solid #F97316',
              padding: '40px 48px',
            }}
          >
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
              <div>
                <span style={{ fontFamily: mono, fontSize: '11px', color: '#555555', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', letterSpacing: '-0.04em', color: '#FFFFFF' }}>
                  {r.title ?? t('opportunityFallback', { num: i + 1 })}
                </h2>
              </div>

              {/* ROI highlight box */}
              {r.roi && (
                <div
                  style={{
                    background: 'rgba(249,115,22,0.08)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    padding: '16px 24px',
                    textAlign: 'center',
                    minWidth: '140px',
                    flexShrink: 0,
                  }}
                >
                  <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {t('estRoiLabel')}
                  </p>
                  <p style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '28px', color: '#F97316', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {r.roi}
                  </p>
                </div>
              )}
            </div>

            {/* Meta badges */}
            {(r.complexity || r.timeline) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
                {r.complexity && (
                  <span style={{ fontFamily: mono, fontSize: '11px', color: '#888888', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 12px', letterSpacing: '0.05em' }}>
                    {t('complexityLabel', { value: r.complexity })}
                  </span>
                )}
                {r.timeline && (
                  <span style={{ fontFamily: mono, fontSize: '11px', color: '#888888', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 12px', letterSpacing: '0.05em' }}>
                    {t('timelineLabel', { value: r.timeline })}
                  </span>
                )}
              </div>
            )}

            {/* Problem / Solution grid */}
            <div style={{ display: 'grid', gap: '32px', marginBottom: '28px' }} className="grid-cols-1 lg:grid-cols-2">
              <div>
                <p style={{ fontFamily: mono, fontSize: '10px', color: 'rgba(249,115,22,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  {t('problemLabel')}
                </p>
                <p style={{ fontFamily: sans, fontSize: '14px', color: '#888888', lineHeight: 1.8 }}>
                  {r.problem}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: mono, fontSize: '10px', color: 'rgba(249,115,22,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  {t('solutionLabel')}
                </p>
                <p style={{ fontFamily: sans, fontSize: '14px', color: '#CCCCCC', lineHeight: 1.8 }}>
                  {r.solution}
                </p>
              </div>
            </div>

            {/* Tools row */}
            <div>
              <p style={{ fontFamily: mono, fontSize: '10px', color: '#444444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                {t('toolsLabel')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {r.tools.map((tool) => (
                  <span
                    key={tool}
                    style={{
                      fontFamily: mono,
                      fontSize: '11px',
                      color: '#F97316',
                      background: 'rgba(249,115,22,0.08)',
                      border: '1px solid rgba(249,115,22,0.2)',
                      padding: '4px 12px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer CTA ── */}
      <div
        className="no-print"
        style={{
          background: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.07)',
          borderTop: '1px solid rgba(249,115,22,0.2)',
          padding: '48px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
          {t('readyToBuildLabel')}
        </p>
        <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#FFFFFF', marginBottom: '12px' }}>
          {t('ctaTitle')}
        </h2>
        <p style={{ fontFamily: sans, fontSize: '15px', color: '#666666', maxWidth: '440px', margin: '0 auto 32px', lineHeight: 1.7 }}>
          {t('ctaBody')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {onEstimate ? (
            <button
              onClick={onEstimate}
              style={{
                fontFamily: mono,
                fontWeight: 700,
                fontSize: '14px',
                color: '#000000',
                background: '#F97316',
                padding: '14px 28px',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
              }}
            >
              {t('getEstimateCta')}
            </button>
          ) : (
            <Link
              href="/contact"
              style={{
                fontFamily: mono,
                fontWeight: 700,
                fontSize: '14px',
                color: '#000000',
                background: '#F97316',
                padding: '14px 28px',
                textDecoration: 'none',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
              }}
            >
              {t('bookCallCta')}
            </Link>
          )}
          <button
            onClick={handlePrint}
            style={{
              fontFamily: sans,
              fontWeight: 500,
              fontSize: '14px',
              color: '#CCCCCC',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '14px 28px',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
          >
            {t('downloadPdfCta')}
          </button>
          {onEstimate && (
            <Link
              href="/contact"
              style={{
                fontFamily: sans,
                fontWeight: 500,
                fontSize: '14px',
                color: '#CCCCCC',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '14px 28px',
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              {t('bookDiscoveryCallCta')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
