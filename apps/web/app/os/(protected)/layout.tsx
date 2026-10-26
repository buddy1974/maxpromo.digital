'use client'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@maxpromo/ui'
import { OsLocaleProvider, useOsLocale } from '@/lib/os-i18n/context'
import { LanguageSwitcher } from '@/components/os/LanguageSwitcher'
import { MaxProvider, useMax } from '@/components/os/max/MaxProvider'
import { PhoneNav, PhoneTopBar, ShellBanner, useOsAppRuntime, useShellStatus } from '@/components/os/shell/PhoneShell'

/**
 * The back office's own chrome, owned by the routes that use it.
 *
 * Two shells from one tree, switched by CSS at 900px:
 *   desktop  the sidebar, the floating Max and Quick Scan controls, Max as a slide-over
 *   phone    a top app bar, a bottom navigation (Today · Inbox · Money · Max · More) and sheets;
 *            Max is a destination (/os/ask), Quick Scan lives in More — nothing floats over content
 *
 * Universal Max (ADR-0029) is one surface in both: the conversation, the composer and the proposal
 * cards (components/os/max), loaded only when opened. Quick Scan opens Max in capture mode — one
 * pipeline for documents, not a second extraction screen.
 *
 * The stylesheet lives with this boundary (not app/globals.css) so public pages never download it;
 * `/os/login` uses none of it.
 */
import './os-layout.css'

const mono = 'var(--brand-font-mono)'
const sans = 'var(--brand-font-body)'
const MaxSurface = dynamic(() => import('@/components/os/max/MaxSurface'), { ssr: false })

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <OsLocaleProvider>
      <MaxProvider>
        <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
      </MaxProvider>
    </OsLocaleProvider>
  )
}

function ProtectedLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useOsLocale()
  const router = useRouter()
  const pathname = usePathname()
  const max = useMax()
  const aiOpen = max.panelOpen
  const shell = useShellStatus()
  useOsAppRuntime()

  const MAIN_NAV = [
    { icon: 'dashboard'  as const, label: t.sidebar.navDashboard,  href: '/os' },
    { icon: 'inbox'      as const, label: t.sidebar.navInbox,      href: '/os/inbox' },
    { icon: 'audit'      as const, label: t.sidebar.navMoney,      href: '/os/money' },
    { icon: 'invoice'    as const, label: t.sidebar.navInvoices,   href: '/os/invoices' },
    { icon: 'quote'      as const, label: t.sidebar.navAngebote,   href: '/os/angebote' },
    { icon: 'clients'    as const, label: t.sidebar.navClients,    href: '/os/clients' },
    { icon: 'leads'      as const, label: t.sidebar.navLeads,      href: '/os/leads' },
    { icon: 'jobs'       as const, label: t.sidebar.navJobs,       href: '/os/jobs' },
    { icon: 'newsletter' as const, label: t.sidebar.navNewsletter, href: '/os/newsletter' },
    { icon: 'approvals'  as const, label: t.sidebar.navApprovals,  href: '/os/approvals' },
  ]
  const isActive = (href: string) => (href === '/os' ? pathname === '/os' : pathname.startsWith(href))
  const onAskPage = pathname === '/os/ask'

  async function logout() {
    try { await fetch('/api/os/logout', { method: 'POST' }) } finally { router.replace('/os/login') }
  }

  return (
    <div className="os-shell">
      {/* ── DESKTOP SIDEBAR ── */}
      <nav className="os-sidebar" aria-label={t.shell.nav}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--brand-border)', flexShrink: 0 }}>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-micro)', fontWeight: 700, color: 'var(--brand-primary-text)', margin: 0, letterSpacing: '0.1em' }}>{t.sidebar.brand}</p>
          <p style={{ fontFamily: sans, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)', margin: '5px 0 0' }}>{t.sidebar.tagline}</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--space-2)' }}>
          <span className="os-section-label">{t.sidebar.sectionMain}</span>
          {MAIN_NAV.map(item => {
            const badge = item.href === '/os/inbox' ? shell.status?.needsReply : item.href === '/os/approvals' ? shell.status?.approvals : item.href === '/os/money' ? shell.status?.money : 0
            return (
              <Link key={item.href} href={item.href} className={`os-nav-item${isActive(item.href) ? ' active' : ''}`} aria-current={isActive(item.href) ? 'page' : undefined}>
                <span className="os-nav-icon"><Icon name={item.icon} size="md" /></span>
                <span className="os-nav-label">{item.label}</span>
                {badge ? <span className="os-badge os-badge-inline">{badge}</span> : null}
              </Link>
            )
          })}
          <span className="os-section-label" style={{ paddingTop: 'var(--space-3)' }}>{t.sidebar.sectionTools}</span>
          <button type="button" onClick={() => max.openMax()} className="os-nav-item">
            <span className="os-nav-icon"><Icon name="message" size="md" /></span>
            <span className="os-nav-label">{t.sidebar.toolAiAssistant}</span>
          </button>
          <button type="button" onClick={() => max.openMax({ scan: true })} className="os-nav-item">
            <span className="os-nav-icon"><Icon name="upload" size="md" /></span>
            <span className="os-nav-label">{t.shell.quickScan}</span>
          </button>
          <div style={{ margin: 'var(--space-3) var(--space-4)', height: '1px', background: 'var(--brand-border)' }} />
          <span className="os-section-label" style={{ paddingTop: 'var(--space-1)' }}>{t.sidebar.sectionLinks}</span>
          {/* One login (ADR-0030): the OS hands the owner over with a one-time ticket. */}
          <a href="/api/os/bureau/handoff" target="_blank" rel="noopener" className="os-nav-item">
            <span className="os-nav-icon"><Icon name="agents" size="md" /></span>
            <span className="os-nav-label">{t.shell.agentBureau}</span>
          </a>
          <a href="https://maxpromo.digital" target="_blank" rel="noopener noreferrer" className="os-nav-item">
            <span className="os-nav-icon"><Icon name="external" size="md" /></span>
            <span className="os-nav-label">{t.sidebar.linkWebsite}</span>
          </a>
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--brand-border)', flexShrink: 0 }}>
          <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: '0 0 3px' }}>Marcel Tabit Akwe</p>
          <p style={{ fontFamily: sans, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)', margin: 0 }}>info@maxpromo.digital</p>
          <button type="button" onClick={logout} className="os-logout-btn">{t.sidebar.signOut}</button>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* ── PHONE TOP BAR ── */}
      <PhoneTopBar />

      {/* ── MAIN CONTENT: the one scroll owner ── */}
      <main className={`os-main${onAskPage ? ' os-main-ask' : ''}`} id="os-main">
        <ShellBanner expired={shell.expired} offline={shell.offline} />
        {children}
      </main>

      {/* ── PHONE BOTTOM NAVIGATION ── */}
      <PhoneNav status={shell.status} onQuickScan={() => max.openMax({ scan: true })} onSignOut={logout} />

      {/* ── DESKTOP FLOATING CONTROLS (hidden on phones by architecture: Max is a tab there) ── */}
      {!aiOpen && !onAskPage && (
        <div className="os-fab">
          <button type="button" className="os-fab-secondary" onClick={() => max.openMax({ scan: true })}>{t.quickScan.floatingButton}</button>
          <button type="button" className="os-fab-primary" onClick={() => max.openMax()}>{t.ai.askButton}</button>
        </div>
      )}

      {/* ── DESKTOP ASK MAX SLIDE-OVER ── */}
      {aiOpen && (
        <aside className="os-askpanel" aria-label={t.ai.title}>
          <div className="os-askpanel-head">
            <div>
              <p style={{ fontFamily: sans, fontWeight: 'var(--weight-heading)', fontSize: '14px', color: 'var(--brand-text)', margin: 0 }}>{t.ai.title}</p>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.18em', margin: '3px 0 0' }}>{t.ai.subtitle}</p>
            </div>
            <button type="button" className="os-icon-button" onClick={max.closePanel} aria-label={t.shell.close}><Icon name="close" size="md" /></button>
          </div>
          <MaxSurface onNavigate={max.closePanel} autoFocus />
        </aside>
      )}

    </div>
  )
}
