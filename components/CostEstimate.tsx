'use client'

import { useState, useMemo } from 'react'

const mono = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans = 'var(--font-inter)'

/* ── Types ───────────────────────────────────────────────────── */

export interface LineItem {
  id: string
  description: string
  detail: string
  unit: string
  priceMin: number
  priceMax: number
  recommended: boolean
  included: boolean
  note?: string
}

export interface LineItemGroup {
  category: string
  items: LineItem[]
}

export interface EstimateData {
  estimateTitle: string
  estimateDate: string
  validUntil: string
  currency: string
  lineItems: LineItemGroup[]
  totals: {
    oneTimeMin: number
    oneTimeMax: number
    monthlyMin: number
    monthlyMax: number
    yearOneMin: number
    yearOneMax: number
  }
  vatNotice: string
  paymentTerms: string
  validityNote: string
  scopeNote: string
  estimateScope: string
  includedInAll: string[]
}

interface CostEstimateProps {
  estimate: EstimateData
  company: string
  name: string
  email: string
  auditResults: { title?: string; solution: string; tools: string[] }[]
  onBack: () => void
  backLabel?: string
  showProgress?: boolean
}

/* ── Helpers ─────────────────────────────────────────────────── */

function eur(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function isOptionalGroup(category: string): boolean {
  return category.toLowerCase().includes('optional')
}

function isRecurringGroup(category: string): boolean {
  return (
    category.toLowerCase().includes('laufend') ||
    category.toLowerCase().includes('recurring')
  )
}

/* ── Scope Badge ─────────────────────────────────────────────── */

function ScopeBadge({ scope }: { scope: string }) {
  const styles: Record<string, React.CSSProperties> = {
    Starter: {
      background: 'transparent',
      border: '1px solid #666666',
      color: '#888888',
    },
    Growth: {
      background: '#F97316',
      border: 'none',
      color: '#000000',
    },
    Professional: {
      background: '#FFFFFF',
      border: 'none',
      color: '#000000',
    },
    Enterprise: {
      background: '#F97316',
      border: 'none',
      color: '#000000',
      boxShadow: '0 0 20px rgba(249,115,22,0.5)',
    },
  }
  const s = styles[scope] ?? styles['Growth']
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: '11px',
        fontWeight: 700,
        padding: '4px 14px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        display: 'inline-block',
        ...s,
      }}
    >
      {scope}
    </span>
  )
}

/* ── Stage Progress ──────────────────────────────────────────── */

function StageProgress({ current }: { current: 'estimate' | 'sent' }) {
  const stages = ['Questions', 'AI Summary', 'Estimate', 'Sent']
  const currentIdx = current === 'estimate' ? 2 : 3
  return (
    <div
      className="no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '32px',
        flexWrap: 'wrap',
      }}
    >
      {stages.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontFamily: mono,
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: i < currentIdx ? '#F97316' : i === currentIdx ? '#FFFFFF' : '#444444',
            }}
          >
            {i < currentIdx ? `✓ ${s}` : s}
          </span>
          {i < stages.length - 1 && (
            <span
              style={{
                fontFamily: mono,
                fontSize: '10px',
                color: i < currentIdx ? '#F97316' : '#333333',
                margin: '0 2px',
              }}
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Item Row ────────────────────────────────────────────────── */

function ItemRow({
  item,
  optional,
  selected,
  onToggle,
}: {
  item: LineItem
  optional: boolean
  selected: boolean
  onToggle?: () => void
}) {
  const active = !optional || selected
  return (
    <div
      style={{
        borderLeft: item.recommended && !optional ? '3px solid #F97316' : '3px solid transparent',
        padding: '14px 16px',
        marginBottom: '2px',
        background: active ? 'rgba(255,255,255,0.02)' : 'transparent',
        opacity: active ? 1 : 0.45,
        transition: 'opacity 150ms ease',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      {/* Toggle for optional items */}
      {optional && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={selected ? 'Deselect item' : 'Select item'}
          style={{
            flexShrink: 0,
            width: '22px',
            height: '22px',
            marginTop: '2px',
            background: selected ? '#F97316' : 'transparent',
            border: selected ? 'none' : '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: '#000',
            transition: 'all 150ms ease',
          }}
        >
          {selected ? '✓' : ''}
        </button>
      )}

      {/* Included checkmark for non-optional */}
      {!optional && item.included && (
        <span
          style={{
            flexShrink: 0,
            width: '22px',
            height: '22px',
            marginTop: '2px',
            background: '#F97316',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: '#000',
          }}
        >
          ✓
        </span>
      )}

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <p
              style={{
                fontFamily: sans,
                fontSize: '14px',
                fontWeight: 500,
                color: active ? '#FFFFFF' : '#888888',
                margin: 0,
              }}
            >
              {item.description}
              {item.recommended && optional && (
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: '9px',
                    color: '#F97316',
                    letterSpacing: '0.1em',
                    marginLeft: '8px',
                    verticalAlign: 'middle',
                    textTransform: 'uppercase',
                  }}
                >
                  Empfohlen
                </span>
              )}
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: '12px',
                color: '#666666',
                margin: '3px 0 0',
                lineHeight: 1.5,
              }}
            >
              {item.detail}
            </p>
            {item.note && (
              <p style={{ fontFamily: mono, fontSize: '10px', color: '#444444', margin: '4px 0 0' }}>
                // {item.note}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p
              style={{
                fontFamily: grotesk,
                fontSize: '15px',
                fontWeight: 700,
                color: active ? '#FFFFFF' : '#555555',
                margin: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {eur(item.priceMin)} – {eur(item.priceMax)}
            </p>
            <p
              style={{
                fontFamily: mono,
                fontSize: '10px',
                color: '#555555',
                margin: '2px 0 0',
              }}
            >
              {item.unit}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────── */

export default function CostEstimate({
  estimate,
  company,
  name,
  email,
  auditResults,
  onBack,
  backLabel = '← AI Summary',
  showProgress = true,
}: CostEstimateProps) {
  // Track which optional items are selected
  const [selected, setSelected] = useState<Set<string>>(() => {
    const s = new Set<string>()
    estimate.lineItems.forEach((group) => {
      if (isOptionalGroup(group.category)) {
        group.items.forEach((item) => {
          if (item.recommended) s.add(item.id)
        })
      }
    })
    return s
  })

  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(estimate.lineItems.map((g) => g.category))
  )

  const toggleSection = (cat: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Recalculate totals based on selected optional items
  const totals = useMemo(() => {
    let oneTimeMin = 0,
      oneTimeMax = 0,
      monthlyMin = 0,
      monthlyMax = 0
    estimate.lineItems.forEach((group) => {
      const recurring = isRecurringGroup(group.category)
      const optional = isOptionalGroup(group.category)
      group.items.forEach((item) => {
        const include = optional ? selected.has(item.id) : true
        if (!include) return
        if (recurring) {
          monthlyMin += item.priceMin
          monthlyMax += item.priceMax
        } else if (!optional) {
          oneTimeMin += item.priceMin
          oneTimeMax += item.priceMax
        } else {
          // Optional one-time items
          oneTimeMin += item.priceMin
          oneTimeMax += item.priceMax
        }
      })
    })
    return {
      oneTimeMin,
      oneTimeMax,
      monthlyMin,
      monthlyMax,
      yearOneMin: oneTimeMin + monthlyMin * 12,
      yearOneMax: oneTimeMax + monthlyMax * 12,
    }
  }, [estimate.lineItems, selected])

  const sendReport = async () => {
    setSendState('sending')
    try {
      const res = await fetch('/api/discovery/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, auditResults, estimate }),
      })
      if (!res.ok) throw new Error('Send failed')
      setSendState('sent')
    } catch {
      setSendState('error')
    }
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '0 16px 80px' }}>
      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-white { background: white !important; color: black !important; border-color: #dddddd !important; }
          .print-white * { color: black !important; }
          .estimate-header { background: #0A0A0A !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-orange { color: #F97316 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {showProgress && <StageProgress current="estimate" />}

      {/* ── Header ── */}
      <div
        className="estimate-header"
        style={{
          background: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '3px solid #F97316',
          padding: '40px 48px',
          marginBottom: '2px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <p
              className="print-orange"
              style={{
                fontFamily: mono,
                fontSize: '10px',
                color: '#F97316',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Kostenvoranschlag / Cost Estimate
            </p>
            <h1
              style={{
                fontFamily: grotesk,
                fontWeight: 700,
                fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                letterSpacing: '-0.04em',
                color: '#FFFFFF',
                marginBottom: '4px',
              }}
            >
              Ihr Kostenvoranschlag
            </h1>
            <p style={{ fontFamily: sans, fontSize: '15px', color: '#666666' }}>
              {company || name} · Estimate for Maxpromo Digital services
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <ScopeBadge scope={estimate.estimateScope} />
            <p style={{ fontFamily: mono, fontSize: '11px', color: '#555555', marginTop: '8px' }}>
              Erstellt: {formatDate(estimate.estimateDate)}
            </p>
            <p style={{ fontFamily: mono, fontSize: '11px', color: '#444444' }}>
              Gültig bis: {formatDate(estimate.validUntil)}
            </p>
          </div>
        </div>

        {estimate.scopeNote && (
          <p style={{ fontFamily: sans, fontSize: '13px', color: '#888888', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', lineHeight: 1.7 }}>
            {estimate.scopeNote}
          </p>
        )}
      </div>

      {/* ── Included in all ── */}
      <div
        className="print-white"
        style={{
          background: '#0F1A0F',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: '1px solid rgba(34,197,94,0.2)',
          padding: '24px 32px',
          marginBottom: '2px',
        }}
      >
        <p style={{ fontFamily: mono, fontSize: '10px', color: '#22c55e', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Immer inbegriffen / Always Included
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
          {estimate.includedInAll.map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#22c55e', flexShrink: 0, marginTop: '1px' }}>✓</span>
              <span style={{ fontFamily: sans, fontSize: '13px', color: '#CCCCCC' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Line Item Sections ── */}
      {estimate.lineItems.map((group) => {
        const optional = isOptionalGroup(group.category)
        const open = openSections.has(group.category)
        return (
          <div
            key={group.category}
            className="print-white"
            style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderTop: '2px solid #F97316',
              marginBottom: '2px',
            }}
          >
            {/* Section header — collapsible */}
            <button
              type="button"
              className="no-print"
              onClick={() => toggleSection(group.category)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <p style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                {group.category}
              </p>
              <span style={{ fontFamily: mono, fontSize: '12px', color: '#444444' }}>
                {open ? '▲' : '▼'}
              </span>
            </button>
            {/* Always show for print */}
            <div
              className={open ? '' : 'no-print'}
              style={{ display: open ? 'block' : 'none', padding: '0 8px 12px' }}
            >
              <div className="print-visible" style={{ display: 'none' }}>
                {/* Print-always visible header */}
                <p style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '16px 16px 8px' }}>
                  {group.category}
                </p>
              </div>
              {group.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  optional={optional}
                  selected={optional ? selected.has(item.id) : true}
                  onToggle={optional ? () => toggleItem(item.id) : undefined}
                />
              ))}
              {optional && (
                <p style={{ fontFamily: mono, fontSize: '10px', color: '#444444', padding: '8px 16px', letterSpacing: '0.08em' }}>
                  // Toggle items on/off to update total estimate
                </p>
              )}
            </div>
          </div>
        )
      })}

      {/* ── Totals ── */}
      <div
        className="print-white"
        style={{
          background: '#0A0A0A',
          border: '1px solid rgba(249,115,22,0.2)',
          padding: '32px 40px',
          marginTop: '8px',
          marginBottom: '2px',
        }}
      >
        <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px' }}>
          Gesamtschätzung / Total Estimate
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#555555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Einmalig / One-time
            </p>
            <p style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#FFFFFF', letterSpacing: '-0.03em' }}>
              {eur(totals.oneTimeMin)} – {eur(totals.oneTimeMax)}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#555555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Monatlich / Monthly
            </p>
            <p style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#FFFFFF', letterSpacing: '-0.03em' }}>
              {eur(totals.monthlyMin)} – {eur(totals.monthlyMax)}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Jahr 1 gesamt / Year 1 Total
            </p>
            <p style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: '#F97316', letterSpacing: '-0.03em' }}>
              {eur(totals.yearOneMin)} – {eur(totals.yearOneMax)}
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
          <p style={{ fontFamily: mono, fontSize: '11px', color: '#555555', letterSpacing: '0.05em', marginBottom: '4px' }}>
            {estimate.vatNotice}
          </p>
          <p style={{ fontFamily: mono, fontSize: '11px', color: '#444444', letterSpacing: '0.05em' }}>
            Alle Preise sind Nettopreise.
          </p>
        </div>
      </div>

      {/* ── Payment terms ── */}
      <div
        className="print-white"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2px',
          marginBottom: '2px',
        }}
      >
        {[
          { pct: '50%', label: 'Anzahlung', sub: 'At contract signing' },
          { pct: '50%', label: 'Bei Abnahme', sub: 'At project delivery' },
        ].map((p) => (
          <div
            key={p.label}
            style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '2rem', color: '#F97316', letterSpacing: '-0.03em', marginBottom: '4px' }}>
              {p.pct}
            </p>
            <p style={{ fontFamily: mono, fontSize: '11px', color: '#FFFFFF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {p.label}
            </p>
            <p style={{ fontFamily: sans, fontSize: '12px', color: '#666666' }}>{p.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Validity ── */}
      <div
        className="print-white"
        style={{
          background: '#0D0D0D',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '24px',
        }}
      >
        <p style={{ fontFamily: mono, fontSize: '11px', color: '#555555', letterSpacing: '0.08em' }}>
          Erstellt: {formatDate(estimate.estimateDate)}
        </p>
        <p style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.08em' }}>
          Angebot gültig bis: {formatDate(estimate.validUntil)}
        </p>
        <p style={{ fontFamily: mono, fontSize: '11px', color: '#333333', letterSpacing: '0.08em' }}>
          Maxpromo Digital · info@maxpromo.digital
        </p>
      </div>

      {/* ── CTA ── */}
      <div
        className="no-print"
        style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            fontFamily: sans,
            fontWeight: 500,
            fontSize: '14px',
            color: '#666666',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '13px 24px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {backLabel}
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          style={{
            fontFamily: mono,
            fontWeight: 700,
            fontSize: '12px',
            color: '#CCCCCC',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '13px 24px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          Download Estimate PDF
        </button>

        <button
          type="button"
          onClick={() => { void sendReport() }}
          disabled={sendState === 'sending' || sendState === 'sent'}
          style={{
            fontFamily: mono,
            fontWeight: 700,
            fontSize: '13px',
            color: sendState === 'sent' ? '#22c55e' : '#000000',
            background: sendState === 'sent' ? 'rgba(34,197,94,0.15)' : '#F97316',
            border: sendState === 'sent' ? '1px solid rgba(34,197,94,0.3)' : 'none',
            padding: '13px 28px',
            cursor: sendState === 'idle' || sendState === 'error' ? 'pointer' : 'not-allowed',
            opacity: sendState === 'sending' ? 0.6 : 1,
            flex: 1,
            minWidth: '200px',
            letterSpacing: '0.05em',
            boxShadow: sendState !== 'sent' ? '0 4px 20px rgba(249,115,22,0.3)' : 'none',
            transition: 'all 200ms ease',
          }}
        >
          {sendState === 'idle' && 'Send Report to My Email →'}
          {sendState === 'sending' && 'Sending...'}
          {sendState === 'sent' && `✓ Sent to ${email}`}
          {sendState === 'error' && 'Retry — Send Report →'}
        </button>
      </div>

      {sendState === 'error' && (
        <p style={{ fontFamily: mono, fontSize: '11px', color: '#FF6666', marginTop: '8px' }}>
          // Could not send email. Please contact info@maxpromo.digital directly.
        </p>
      )}
    </div>
  )
}
