'use client'

import { useState, useEffect, useRef } from 'react'

interface DemoLink {
  label: string
  url: string
  icon: string
}

interface Credential {
  label: string
  value: string
}

interface Project {
  id: number
  title: string
  subtitle: string
  status: string
  description: string
  longDescription: string
  tags: string[]
  tech: string[]
  highlights: string[]
  demoLinks: DemoLink[]
  credentials: Credential[]
  primaryUrl: string
  thumbnail: string | null
  color: string
}

const PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Restaurant OS',
    subtitle: 'AI-Powered Restaurant Ordering Platform',
    status: 'live',
    description:
      'A full-stack multi-tenant SaaS that modernizes restaurant operations. Customers scan a QR code at their table, browse the menu on their phone, and pay individually or as a group — no app download required.',
    longDescription:
      'Built from scratch as a complete restaurant technology stack. Multi-tenant architecture supports unlimited restaurants from a single deployment. AI chef recommendations upsell matching dishes during ordering. Full multilingual support across 5 languages including RTL for Arabic. AI menu import — upload a photo of any printed menu and Claude extracts all items instantly.',
    tags: ['SaaS', 'AI Integration', 'Multi-tenant', 'Payments'],
    tech: ['Next.js 14', 'TypeScript', 'Neon PostgreSQL', 'Stripe', 'Claude AI', 'Vercel', 'Tailwind CSS'],
    highlights: [
      'QR-based ordering with individual and group bill splitting',
      'Cash and card payments — Stripe, Google Pay, Apple Pay with tip selection',
      'Real-time Kitchen Display System — chef marks orders ready from any device',
      'AI chef recommendations that upsell matching dishes during ordering',
      'Full multilingual — EN/DE/TR/FR/AR with automatic AI menu translation and RTL',
      'AI menu import — photograph any printed menu, Claude extracts all items instantly',
      'Push notifications when food is ready',
      'Analytics dashboard — revenue, top sellers, busiest hours, table performance',
      'Multi-restaurant onboarding — new restaurant live in 60 seconds',
      'Telegram notifications for staff',
    ],
    demoLinks: [
      { label: 'Customer Menu', url: 'https://restaurant-os-one.vercel.app/demo/menu/1', icon: '📱' },
      { label: 'Kitchen Display', url: 'https://restaurant-os-one.vercel.app/demo/kitchen', icon: '🍳' },
      { label: 'Admin Panel', url: 'https://restaurant-os-one.vercel.app/demo/admin', icon: '⚙️' },
      { label: 'Analytics', url: 'https://restaurant-os-one.vercel.app/demo/analytics', icon: '📊' },
      { label: 'Register', url: 'https://restaurant-os-one.vercel.app/register', icon: '🚀' },
    ],
    credentials: [
      { label: 'Stripe test card', value: '4242 4242 4242 4242 / 12/34 / 123' },
    ],
    primaryUrl: 'https://restaurant-os-one.vercel.app',
    thumbnail: null,
    color: '#F97316',
  },
  {
    id: 2,
    title: 'Urologie Neuwied — PraxisOS',
    subtitle: 'Full-Stack Medical Practice Platform',
    status: 'live',
    description:
      'A complete digital transformation for a specialist urology practice in Germany — built from scratch in under 6 weeks. A three-layer system: multilingual public website, AI-powered internal practice OS with 16 modules, and a live REST API.',
    longDescription:
      'Public Website built on Next.js 15 with i18n (DE/EN/FR/TR), embedded Claude AI chatbot for patient queries, JSON-LD medical schema, Doctolib booking integration. PraxisOS Dashboard — React + Vite internal OS covering appointments, patient records, lab results, billing (GOÄ/EBM), document management, team scheduling, quality management, video consultations, HR, compliance (DSGVO/BSI/KBV), and analytics — all role-filtered by staff type.',
    tags: ['Healthcare', 'Medical OS', 'Multi-lingual', 'AI'],
    tech: ['Next.js 15', 'React', 'Vite', 'TypeScript', 'Fastify', 'Neon PostgreSQL', 'Drizzle', 'Claude AI', 'Vercel', 'Render', 'Tailwind'],
    highlights: [
      'Three-layer system: website + internal OS + REST API',
      '16 operational modules covering every practice function',
      'Claude AI embedded throughout — patient chatbot, letter drafting, lab interpretation',
      'ICD-10 and GOÄ code suggestions, OCR document scanning',
      'GOÄ/EBM billing compliance built in',
      'DSGVO/BSI/KBV compliance architecture',
      'Multilingual — DE/EN/FR/TR',
      'Fastify API on Render with Drizzle ORM',
      'Built in under 6 weeks from scratch',
    ],
    demoLinks: [
      { label: 'Website', url: 'https://urologie-six.vercel.app', icon: '🌐' },
      { label: 'PraxisOS Dashboard', url: 'https://urologie-dashboard-one.vercel.app', icon: '🖥️' },
      { label: 'API Health', url: 'https://urologie-backend.onrender.com/health', icon: '⚙️' },
    ],
    credentials: [
      { label: 'Dashboard login', value: 'dr.fomuki@urologie-neuwied.de' },
      { label: 'Password', value: 'praxis2024' },
    ],
    primaryUrl: 'https://urologie-six.vercel.app',
    thumbnail: null,
    color: '#3B82F6',
  },
  {
    id: 3,
    title: 'HandwerkOS',
    subtitle: 'AI-First Field-to-Office SaaS for Trade Businesses',
    status: 'live',
    description:
      'A full-stack SaaS platform built for small-to-medium trade businesses (2–50 workers), replacing paper-based workflows with an AI-powered mobile-first system. Built from zero to production in 5 sessions.',
    longDescription:
      'Workers photograph a handwritten job note on their phone — AI reads it, creates the customer, fills the project form, and fires the address autocomplete. One photo. Zero admin. Built for two markets: Full German build (DE locale, €, MwSt, XRechnung) and US build (EN locale, $, State fields) — switchable per company.',
    tags: ['SaaS', 'Trade', 'AI OCR', 'Mobile-first', 'Dual Market'],
    tech: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind v4', 'Neon PostgreSQL', 'Drizzle ORM', 'NextAuth v5', 'Claude AI', 'Vercel', 'Resend'],
    highlights: [
      'AI OCR project import — photograph job note, AI creates everything',
      'GPS-verified time tracking',
      'Drag-and-drop dispatch board (Plantafel)',
      'Branded PDF quotes and invoices',
      'XRechnung/ZUGFeRD e-invoice export — EU legal standard',
      '5-year warranty tracking',
      'Recurring maintenance contracts with auto-invoicing',
      'PWA push notifications',
      'Trade-aware AI checklists and market price suggestions',
      'Dual market — DE (€, MwSt) and US ($, routing numbers) switchable per company',
    ],
    demoLinks: [
      { label: 'Live Demo', url: 'https://handwerkos.vercel.app', icon: '🔗' },
    ],
    credentials: [
      { label: '🇩🇪 German admin', value: 'admin@handwerkos.de / admin123456' },
      { label: '🇺🇸 PSL Services (US)', value: 'admin@pslservicesllc.com / psl123456' },
      { label: '🇺🇸 MM Flooring (US)', value: 'admin@mmflooringsolutions.com / mm123456' },
    ],
    primaryUrl: 'https://handwerkos.vercel.app',
    thumbnail: null,
    color: '#22C55E',
  },
  {
    id: 4,
    title: 'Envico CareOS 2026',
    subtitle: 'AI-Powered Enterprise Care Management Platform',
    status: 'live',
    description:
      'Built as a personal gift for the CEO of Envico Supported Living LTD, a CQC-registered care provider. Nine phases delivered from scratch — public website, internal dashboard, REST API, AI assistant (Donna), CEO digital office, n8n automation workflows, and a family portal.',
    longDescription:
      'After watching the CEO manage a growing care organisation with disconnected tools and paper-based systems, this complete operating system was built over several months. The system replaces every manual process — from referral intake to staff rotas, CQC compliance tracking to invoice chasing — with a single integrated platform running 24/7.',
    tags: ['Healthcare', 'Care Management', 'Enterprise OS', 'AI Assistant'],
    tech: ['Next.js 15', 'React', 'Vite', 'Fastify', 'TypeScript', 'Prisma', 'Supabase', 'Claude AI', 'n8n', 'Resend', 'Cloudflare Zero Trust', 'Vercel', 'Render'],
    highlights: [
      '20-page public website with AI referral chatbot, family portal and PWA',
      '16-module internal dashboard covering every operational area',
      'Donna AI (Claude Sonnet) — natural language queries, daily CEO briefing, email drafting',
      '70+ API endpoints, 22 database tables',
      'n8n workflows running 24/7 — referrals, compliance alerts, invoice chasing',
      'CQC-compliant architecture throughout',
      'CEO digital office with Gmail and Google Calendar integration',
      'Family portal — secure access to care records for relatives',
      'Built across 9 phases from zero',
    ],
    demoLinks: [
      { label: 'Website', url: 'https://envico.maxpromo.digital', icon: '🌐' },
      { label: 'Dashboard', url: 'https://envico-dashboard.vercel.app', icon: '📊' },
      { label: 'Portal', url: 'https://envico.maxpromo.digital/portal', icon: '🔐' },
      { label: 'Bishops House', url: 'https://envico.maxpromo.digital/bishops-house', icon: '🏠' },
    ],
    credentials: [
      { label: 'Demo login', value: 'admin@test.com / 12345678' },
      { label: 'Role', value: 'ADMIN → CEO dashboard' },
    ],
    primaryUrl: 'https://envico.maxpromo.digital',
    thumbnail: null,
    color: '#A855F7',
  },
  {
    id: 5,
    title: 'PrintShop',
    subtitle: 'AI-Powered Print Management Platform',
    status: 'live',
    description:
      'A full-stack SaaS platform built for professional print shops. Customers configure products, upload print files, and check out — while an embedded Claude AI assistant validates files, advises on materials, and guides orders in real time.',
    longDescription:
      'Admins manage the full operation from a single panel: orders, production queue, invoicing, AI configuration, and white-label branding — no code required. Multi-language support across EN/DE/FR. Stripe payments integrated throughout.',
    tags: ['SaaS', 'Print', 'E-commerce', 'AI Assistant', 'White-label'],
    tech: ['Next.js', 'TypeScript', 'PostgreSQL (Neon)', 'Prisma', 'Stripe', 'Claude AI', 'Fabric.js', 'Vercel Blob', 'Tailwind'],
    highlights: [
      'AI assistant validates print files and advises on materials in real time',
      'Full product configurator with live preview',
      'Stripe payments with complete checkout flow',
      'Admin panel — orders, production queue, invoicing',
      'White-label branding — no code required',
      'AI configuration built into admin',
      'Multi-language — EN/DE/FR',
      'Vercel Blob for file storage',
    ],
    demoLinks: [
      { label: 'Platform', url: 'https://printshop.maxpromo.digital', icon: '🌐' },
      { label: 'Shop', url: 'https://printshop.maxpromo.digital/shop', icon: '🛒' },
      { label: 'Admin Panel', url: 'https://printshop.maxpromo.digital/admin', icon: '⚙️' },
    ],
    credentials: [
      { label: 'Customer', value: 'demo@printshop.test / Demo1234!' },
      { label: 'Admin', value: 'admin@printshop.test / Admin1234!' },
      { label: 'Stripe test card', value: '4242 4242 4242 4242 · 12/29 · 123' },
    ],
    primaryUrl: 'https://printshop.maxpromo.digital',
    thumbnail: null,
    color: '#F59E0B',
  },
  {
    id: 6,
    title: 'NMI Automation OS',
    subtitle: 'AI-Powered Business Operating System',
    status: 'live',
    description:
      "Built for NMI Education, one of Cameroon's leading educational publishing and printing companies. A full AI operating system that runs the business around the clock — AI executive briefings, automatic email routing, WhatsApp agents in FR/EN, and 8 autonomous AI agents.",
    longDescription:
      'The system delivers an AI-written executive briefing every morning, classifies and routes every incoming email automatically, replies to school principals on WhatsApp in French or English at any hour, and runs eight autonomous AI agents that chase invoices, monitor stock, evaluate staff, forecast revenue, and brief the CEO on competitors — all without human intervention. First system of its kind built for this market.',
    tags: ['Enterprise OS', 'AI Agents', 'WhatsApp', 'Operations'],
    tech: ['Next.js 16', 'TypeScript', 'Prisma', 'Neon PostgreSQL', 'Claude AI', 'Google APIs', 'WhatsApp Business API', 'n8n', 'Vercel'],
    highlights: [
      'AI executive briefing delivered every morning automatically',
      'Automatic email classification and routing',
      'WhatsApp agent replies to clients in French or English 24/7',
      '8 autonomous AI agents — invoice chasing, stock monitoring, staff evaluation',
      'Revenue forecasting and competitor briefing agents',
      'CEO digital office with full operational overview',
      'Knowledge base with natural language queries',
      'HR evaluation module',
      'First system of its kind in this market',
    ],
    demoLinks: [
      { label: 'Dashboard', url: 'https://nmi.maxpromo.digital/dashboard', icon: '📊' },
      { label: 'CEO Briefing', url: 'https://nmi.maxpromo.digital/briefing', icon: '📋' },
      { label: 'AI Assistant', url: 'https://nmi.maxpromo.digital/ai', icon: '🤖' },
      { label: 'AI Agents', url: 'https://nmi.maxpromo.digital/agents', icon: '⚡' },
      { label: 'WhatsApp Agent', url: 'https://nmi.maxpromo.digital/whatsapp/simulate', icon: '💬' },
      { label: 'Analytics', url: 'https://nmi.maxpromo.digital/owner', icon: '📈' },
    ],
    credentials: [
      { label: 'All sections', value: 'rogers@nmi.cm / nmi2025' },
    ],
    primaryUrl: 'https://nmi.maxpromo.digital/dashboard',
    thumbnail: null,
    color: '#06B6D4',
  },
]

const ALL_FILTERS = ['All', 'SaaS', 'Healthcare', 'Enterprise OS', 'AI Agents', 'Web Platform']

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function PortfolioPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [stickyFilter, setStickyFilter] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = sessionStorage.getItem('portfolio_auth')
    if (token === 'authorized') {
      setIsAuthenticated(true)
    }
    setCheckingSession(false)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const handleScroll = () => {
      if (filterRef.current) {
        setStickyFilter(window.scrollY > 200)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isAuthenticated])

  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedProject])

  async function handleSubmit() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/portfolio/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        sessionStorage.setItem('portfolio_auth', 'authorized')
        setIsAuthenticated(true)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects =
    activeFilter === 'All'
      ? PROJECTS
      : PROJECTS.filter((p) => p.tags.some((t) => t === activeFilter))

  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: '2px solid #F97316',
            padding: '48px',
            maxWidth: '420px',
            width: '100%',
            margin: '0 24px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '14px',
              marginBottom: '32px',
            }}
          >
            <span style={{ color: '#FFFFFF' }}>MAXPROMO</span>
            <span style={{ color: '#F97316' }}>.DIGITAL</span>
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '28px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '8px',
            }}
          >
            Portfolio Access
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '14px',
              color: '#888888',
              marginBottom: '32px',
              lineHeight: 1.6,
            }}
          >
            This portfolio is shared privately. Enter your access code to continue.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
            placeholder="Enter access code"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${error ? '#FF4444' : 'rgba(255,255,255,0.1)'}`,
              color: '#FFFFFF',
              padding: '14px 16px',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '15px',
              borderRadius: '2px',
              marginBottom: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? '#FF4444' : 'rgba(255,255,255,0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          {error && (
            <p
              style={{
                color: '#FF6B6B',
                fontSize: '13px',
                fontFamily: 'var(--font-dm-sans)',
                marginBottom: '12px',
              }}
            >
              Incorrect code. Please try again.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: '#F97316',
              color: '#000000',
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              padding: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: '2px',
              marginBottom: '24px',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#EA6A00'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#F97316'
            }}
          >
            {loading ? 'Verifying...' : 'Access Portfolio →'}
          </button>

          <p
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '11px',
              color: '#444444',
              textAlign: 'center',
            }}
          >
            To request access: info@maxpromo.digital
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A' }}>
      {/* PAGE HEADER */}
      <div
        style={{
          background: '#0A0A0A',
          padding: '80px 48px 48px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-ibm-mono)',
            fontSize: '11px',
            color: '#F97316',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          PRIVATE PORTFOLIO
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '52px',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '16px',
            lineHeight: 1.05,
          }}
        >
          Project Showcase
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '16px',
            color: '#888888',
            marginBottom: '32px',
          }}
        >
          6 live production systems built by MaxPromo Digital.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['6 Projects', 'All Live', 'Confidential'].map((stat, i) => (
            <span
              key={stat}
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: '11px',
                color: '#666666',
                padding: '6px 14px',
                borderRadius: '2px',
              }}
            >
              {i > 0 && (
                <span style={{ color: '#333333', marginRight: '12px' }}>|</span>
              )}
              {stat}
            </span>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        ref={filterRef}
        style={{
          background: '#0A0A0A',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 48px',
          position: stickyFilter ? 'sticky' : 'relative',
          top: stickyFilter ? 0 : 'auto',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ALL_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: '11px',
                padding: '6px 16px',
                borderRadius: '2px',
                cursor: 'pointer',
                border: activeFilter === f ? 'none' : '1px solid rgba(255,255,255,0.1)',
                background: activeFilter === f ? '#F97316' : 'transparent',
                color: activeFilter === f ? '#000000' : '#888888',
                transition: 'all 0.15s',
                letterSpacing: '0.05em',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* PROJECTS GRID */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
        }}
        className="portfolio-grid"
      >
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => setSelectedProject(project)}
          />
        ))}
      </div>

      {/* MODAL */}
      {selectedProject && (
        <div
          ref={overlayRef}
          onClick={(e) => {
            if (e.target === overlayRef.current) setSelectedProject(null)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            overflowY: 'auto',
            padding: '40px 24px',
          }}
        >
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .portfolio-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

function ProjectCard({
  project,
  onClick,
}: {
  project: Project
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const initials = getInitials(project.title)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111111',
        border: `1px solid ${hovered ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.1)'
          : 'none',
      }}
    >
      {/* THUMBNAIL */}
      <div
        style={{
          height: '220px',
          background: '#0A0A0A',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: '0.4s ease',
              transform: hovered ? 'scale(1.03)' : 'scale(1)',
            }}
          />
        ) : (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, #0A0A0A 0%, ${project.color}15 100%)`,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '72px',
                fontWeight: 800,
                color: project.color,
                opacity: 0.15,
                userSelect: 'none',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {initials}
            </span>
            <span
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: '13px',
                color: project.color,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                zIndex: 2,
              }}
            >
              {project.title}
            </span>
          </>
        )}

        {/* Status badge */}
        <span
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#22C55E',
            fontFamily: 'var(--font-ibm-mono)',
            fontSize: '10px',
            padding: '4px 10px',
            letterSpacing: '0.1em',
            zIndex: 3,
          }}
        >
          ● LIVE
        </span>
      </div>

      {/* CARD BODY */}
      <div style={{ padding: '28px' }}>
        {/* Tags */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '14px',
          }}
        >
          {project.tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: 'rgba(249,115,22,0.08)',
                border: '1px solid rgba(249,115,22,0.2)',
                color: '#F97316',
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: '9px',
                padding: '3px 10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '22px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            marginBottom: '6px',
          }}
        >
          {project.title}
        </h2>

        <p
          style={{
            fontFamily: 'var(--font-ibm-mono)',
            fontSize: '13px',
            color: '#888888',
            marginBottom: '12px',
          }}
        >
          {project.subtitle}
        </p>

        <p
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '14px',
            color: '#AAAAAA',
            lineHeight: 1.65,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '20px',
          }}
        >
          {project.description}
        </p>

        {/* Tech pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '20px',
          }}
        >
          {project.tech.slice(0, 6).map((t) => (
            <span
              key={t}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#666666',
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: '10px',
                padding: '3px 10px',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '11px',
              color: '#22C55E',
            }}
          >
            ● {project.demoLinks.length} live demo{project.demoLinks.length !== 1 ? 's' : ''} available
          </span>
          <span
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '12px',
              color: '#F97316',
            }}
          >
            View Project →
          </span>
        </div>
      </div>
    </div>
  )
}

function ProjectModal({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const initials = getInitials(project.title)

  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        maxWidth: '900px',
        margin: '0 auto',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#FFFFFF',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      >
        ×
      </button>

      {/* MODAL HEADER */}
      <div
        style={{
          height: '280px',
          background: `linear-gradient(135deg, #0A0A0A, ${project.color}20)`,
          display: 'flex',
          alignItems: 'flex-end',
          padding: '32px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            position: 'absolute',
            right: '40px',
            top: '20px',
            fontFamily: 'var(--font-syne)',
            fontSize: '160px',
            fontWeight: 900,
            color: project.color,
            opacity: 0.06,
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          {initials}
        </span>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#22C55E',
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '10px',
              padding: '4px 10px',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}
          >
            ● LIVE
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '36px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '8px',
            }}
          >
            {project.title}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '13px',
              color: '#888888',
            }}
          >
            {project.subtitle}
          </p>
        </div>
      </div>

      {/* MODAL BODY */}
      <div
        style={{
          padding: '40px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
        }}
        className="modal-body-grid"
      >
        {/* LEFT */}
        <div>
          <p
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '10px',
              color: '#F97316',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            // OVERVIEW
          </p>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '15px',
              color: '#CCCCCC',
              lineHeight: 1.75,
              marginBottom: '32px',
            }}
          >
            {project.longDescription}
          </p>

          <p
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '10px',
              color: '#F97316',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            // KEY FEATURES
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {project.highlights.map((h, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    background: '#F97316',
                    flexShrink: 0,
                    marginTop: '7px',
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '14px',
                    color: '#CCCCCC',
                    lineHeight: 1.6,
                  }}
                >
                  {h}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT */}
        <div>
          <p
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '10px',
              color: '#F97316',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            // TECH STACK
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '32px',
            }}
          >
            {project.tech.map((t) => (
              <span
                key={t}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#CCCCCC',
                  fontFamily: 'var(--font-ibm-mono)',
                  fontSize: '11px',
                  padding: '5px 12px',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: '10px',
              color: '#F97316',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            // LIVE DEMOS
          </p>
          <div>
            {project.demoLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '2px',
                  marginBottom: '6px',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(249,115,22,0.06)'
                  e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <span style={{ fontSize: '16px' }}>{link.icon}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '13px',
                    color: '#CCCCCC',
                    flex: 1,
                  }}
                >
                  {link.label}
                </span>
                <span style={{ color: '#F97316', fontSize: '14px' }}>↗</span>
              </a>
            ))}
          </div>

          {project.credentials.length > 0 && (
            <>
              <p
                style={{
                  fontFamily: 'var(--font-ibm-mono)',
                  fontSize: '10px',
                  color: '#F97316',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginTop: '24px',
                  marginBottom: '12px',
                }}
              >
                // DEMO CREDENTIALS
              </p>
              <div
                style={{
                  background: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: '2px solid #F97316',
                  padding: '16px',
                }}
              >
                {project.credentials.map((cred, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: i < project.credentials.length - 1 ? '6px' : 0,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-ibm-mono)',
                        fontSize: '11px',
                        color: '#666666',
                        flexShrink: 0,
                      }}
                    >
                      {cred.label}:
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-ibm-mono)',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#CCCCCC',
                      }}
                    >
                      {cred.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL FOOTER */}
      <div
        style={{
          padding: '24px 40px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <a
          href={project.primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#F97316',
            color: '#000000',
            fontFamily: 'var(--font-ibm-mono)',
            fontSize: '13px',
            fontWeight: 600,
            padding: '12px 28px',
            borderRadius: '2px',
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EA6A00')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#F97316')}
        >
          Visit Live Project →
        </a>
        <button
          onClick={onClose}
          style={{
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#888888',
            background: 'transparent',
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '13px',
            padding: '12px 24px',
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            e.currentTarget.style.color = '#FFFFFF'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            e.currentTarget.style.color = '#888888'
          }}
        >
          Close
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .modal-body-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
