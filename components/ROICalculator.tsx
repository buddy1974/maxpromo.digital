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
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#FFFFFF' }}>
          {label}
        </label>
        <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: '22px', color: '#F97316', letterSpacing: '-0.03em' }}>
          {prefix}{value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#F97316', height: '3px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: '#555555' }}>
          {prefix}{min}{suffix}
        </span>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: '#555555' }}>
          {prefix}{max}{suffix}
        </span>
      </div>
    </div>
  )
}

export default function ROICalculator() {
  const [staff, setStaff] = useState(5)
  const [hours, setHours] = useState(20)
  const [rate, setRate]   = useState(30)

  const hoursSaved    = Math.round(hours * 0.75)
  const monthlySaved  = staff * hours * 0.75 * 4 * rate
  const annualROI     = monthlySaved * 12

  return (
    <section
      style={{
        background: 'linear-gradient(180deg, #0A0A0A 0%, #110800 100%)',
        padding: '6rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '-200px',
          transform: 'translateY(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '80rem', margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: '#FFFFFF',
              marginBottom: '12px',
            }}
          >
            See what automation saves you
          </h2>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '17px', color: '#888888', lineHeight: 1.8 }}>
            Real numbers. No fluff. Based on your actual team.
          </p>
        </div>

        {/* Calculator card */}
        <div
          style={{
            display: 'grid',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Inputs */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              padding: '40px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'rgba(249,115,22,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '32px' }}>
              // your team
            </p>
            <SliderInput label="Staff handling manual tasks"     value={staff} min={1}  max={50}  suffix=" people" onChange={setStaff} />
            <SliderInput label="Hours per week on manual work"   value={hours} min={1}  max={40}  suffix=" hrs/wk" onChange={setHours} />
            <SliderInput label="Average hourly cost per employee" value={rate}  min={10} max={100} prefix="£" suffix="/hr" onChange={setRate} />
          </div>

          {/* Outputs */}
          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'rgba(249,115,22,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '32px' }}>
                // your savings
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
                {[
                  { label: 'Hours saved per week',  value: `${hoursSaved} hrs`, size: '26px' },
                  { label: 'Monthly cost saved',    value: formatGBP(monthlySaved), size: '26px' },
                  { label: 'Annual ROI',             value: formatGBP(annualROI), size: '26px' },
                  { label: 'Typical payback period', value: '60–90 days', size: '22px' },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#888888' }}>
                      {row.label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: row.size, color: '#F97316', letterSpacing: '-0.03em' }}>
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
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  color: '#000000',
                  background: '#F97316',
                  padding: '16px 24px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  borderRadius: '2px',
                  marginBottom: '12px',
                  boxShadow: '0 4px 24px rgba(249,115,22,0.35)',
                  transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 32px rgba(249,115,22,0.5)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(249,115,22,0.35)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Get My Custom Automation Plan →
              </Link>
              <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: '#555555', textAlign: 'center', letterSpacing: '0.05em' }}>
                // 3 discovery call slots remaining this month
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
