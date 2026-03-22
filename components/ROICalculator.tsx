'use client'

import Link from 'next/link'
import { useState } from 'react'

function formatGBP(n: number): string {
  return '£' + Math.round(n).toLocaleString('en-GB')
}

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  prefix?: string
  suffix?: string
  onChange: (n: number) => void
}

function SliderInput({ label, value, min, max, prefix, suffix, onChange }: SliderInputProps) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <label
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '15px',
            color: '#FAFAFF',
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontFamily: 'var(--font-space-mono)',
            fontWeight: 700,
            fontSize: '18px',
            color: '#F97316',
          }}
        >
          {prefix}{value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: '#F97316',
          cursor: 'pointer',
          height: '2px',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: '#6B6B7A' }}>
          {prefix}{min}{suffix}
        </span>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: '#6B6B7A' }}>
          {prefix}{max}{suffix}
        </span>
      </div>
    </div>
  )
}

export default function ROICalculator() {
  const [staff, setStaff] = useState(5)
  const [hours, setHours] = useState(20)
  const [rate, setRate] = useState(30)

  const hoursSaved = Math.round(hours * 0.75)
  const monthlySaved = staff * hours * 0.75 * 4 * rate
  const annualROI = monthlySaved * 12

  return (
    <section style={{ background: '#030305', padding: '6rem 2rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-space-mono)',
              fontSize: '12px',
              color: '#F97316',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            ROI Calculator
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 4.5vw, 3.75rem)',
              letterSpacing: '-0.04em',
              color: '#FAFAFF',
              marginBottom: '12px',
            }}
          >
            See what automation saves you
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '17px',
              color: '#6B6B7A',
              lineHeight: 1.8,
            }}
          >
            Real numbers. No fluff. Based on your actual team.
          </p>
        </div>

        {/* Calculator card */}
        <div
          style={{
            display: 'grid',
            gap: '1px',
            background: 'rgba(255,255,255,0.04)',
          }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Inputs */}
          <div style={{ background: '#111111', padding: '40px' }}>
            <p
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '11px',
                color: '#6B6B7A',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '28px',
              }}
            >
              // your team
            </p>

            <SliderInput
              label="Staff handling manual tasks"
              value={staff}
              min={1}
              max={50}
              suffix=" people"
              onChange={setStaff}
            />
            <SliderInput
              label="Hours per week on manual work"
              value={hours}
              min={1}
              max={40}
              suffix=" hrs/wk"
              onChange={setHours}
            />
            <SliderInput
              label="Average hourly cost per employee"
              value={rate}
              min={10}
              max={100}
              prefix="£"
              suffix="/hr"
              onChange={setRate}
            />
          </div>

          {/* Outputs */}
          <div style={{ background: '#0E0E12', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-space-mono)',
                  fontSize: '11px',
                  color: '#6B6B7A',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: '28px',
                }}
              >
                // your savings
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                {[
                  { label: 'Hours saved per week',  value: `${hoursSaved} hrs` },
                  { label: 'Monthly cost saved',    value: formatGBP(monthlySaved) },
                  { label: 'Annual ROI',             value: formatGBP(annualROI) },
                  { label: 'Typical payback period', value: '60–90 days' },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      paddingBottom: '20px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-dm-sans)',
                        fontSize: '15px',
                        color: '#6B6B7A',
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-space-mono)',
                        fontWeight: 700,
                        fontSize: '22px',
                        color: '#F97316',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Link
                href="/automation-audit"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-space-mono)',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#030305',
                  background: '#F97316',
                  padding: '16px 24px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'opacity 150ms ease',
                  marginBottom: '12px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Get My Custom Automation Plan →
              </Link>
              <p
                style={{
                  fontFamily: 'var(--font-space-mono)',
                  fontSize: '11px',
                  color: '#6B6B7A',
                  textAlign: 'center',
                  letterSpacing: '0.05em',
                }}
              >
                // 3 discovery call slots remaining this month
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
