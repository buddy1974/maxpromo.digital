'use client'
/**
 * The phone's shell (below 900px): a top app bar that names where Marcel is, and a bottom navigation
 * with the five places he runs the business from — Today, Inbox, Money, Max, More. Everything else
 * lives one tap away in the More sheet, Agent Bureau included. No floating controls: Max is a
 * destination, not a bubble over the content.
 *
 * The badges are counts only (/api/os/shell). A lost connection or an expired session is said
 * plainly in a banner, never shown as empty data.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Icon } from '@maxpromo/ui'
import { FALLBACK_DOMAIN, resolveDomain } from '@maxpromo/config'
import { useOsLocale } from '@/lib/os-i18n/context'
import { Sheet } from './Sheet'

const BUREAU_ORIGIN = resolveDomain('agents.maxpromo.digital').origin
const WEBSITE_ORIGIN = FALLBACK_DOMAIN.origin

export interface ShellStatus { needsReply: number; approvals: number; money: number }

/** Badge counts, refreshed on focus and every minute; tells the shell when the session has ended. */
export function useShellStatus() {
  const [status, setStatus] = useState<ShellStatus | null>(null)
  const [expired, setExpired] = useState(false)
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const load = useCallback(() => {
    fetch('/api/os/shell', { cache: 'no-store' })
      .then(async r => {
        if (r.status === 401) { setExpired(true); return }
        if (r.ok) { setStatus(await r.json() as ShellStatus); setExpired(false) }
      })
      .catch(() => undefined)
  }, [])
  useEffect(() => {
    load()
    const onFocus = () => load()
    const goOffline = () => setOffline(true)
    const goOnline = () => { setOffline(false); load() }
    window.addEventListener('focus', onFocus); window.addEventListener('offline', goOffline); window.addEventListener('online', goOnline); window.addEventListener('os:changed', onFocus)
    const timer = window.setInterval(load, 60_000)
    return () => { window.removeEventListener('os:changed', onFocus); window.removeEventListener('focus', onFocus); window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); window.clearInterval(timer) }
  }, [load])
  return { status, expired, offline, reload: load }
}

/**
 * The app runtime the phone needs: the conservative service worker (offline page only, see
 * app/os/sw.js) and the visible-viewport size as CSS variables, so sheets and the composer follow an
 * open keyboard on iOS, where the layout viewport does not shrink.
 */
export function useOsAppRuntime() {
  useEffect(() => {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('/os/sw.js', { scope: '/os' }).catch(() => undefined)
    }
    const vv = window.visualViewport
    if (!vv) return
    const root = document.documentElement
    const apply = () => {
      root.style.setProperty('--os-vvh', `${Math.round(vv.height)}px`)
      root.style.setProperty('--os-vv-top', `${Math.round(vv.offsetTop)}px`)
    }
    apply()
    vv.addEventListener('resize', apply); vv.addEventListener('scroll', apply)
    return () => { vv.removeEventListener('resize', apply); vv.removeEventListener('scroll', apply) }
  }, [])
}

export function ShellBanner({ expired, offline }: { expired: boolean; offline: boolean }) {
  const { t } = useOsLocale()
  if (!expired && !offline) return null
  return (
    <div className="os-shell-banner" role="alert">
      {expired ? <>{t.shell.sessionExpired} <Link href="/os/login">{t.shell.signInAgain}</Link></> : t.shell.offline}
    </div>
  )
}

function titleFor(pathname: string, titles: Record<string, string>): string {
  if (titles[pathname]) return titles[pathname]
  const base = Object.keys(titles).filter(k => k !== '/os' && pathname.startsWith(`${k}/`)).sort((a, b) => b.length - a.length)[0]
  return base ? titles[base] : titles['/os']
}

export function PhoneTopBar() {
  const { t } = useOsLocale()
  const pathname = usePathname()
  // A detail page (an invoice, a quote) gets a back control to its list.
  const parts = pathname.split('/').filter(Boolean)
  const parent = parts.length > 2 ? `/${parts.slice(0, 2).join('/')}` : null
  return (
    <header className="os-topbar">
      {parent ? <Link href={parent} className="os-icon-button os-topbar-back" aria-label={t.shell.back}><span aria-hidden="true">‹</span></Link> : <Image src="/images/brand/maxpromo-icon-192.png" alt="" width={28} height={28} className="os-topbar-mark" priority />}
      <h1 className="os-topbar-title">{titleFor(pathname, t.shell.titles)}</h1>
    </header>
  )
}

export function PhoneNav({ status, onQuickScan, onSignOut }: { status: ShellStatus | null; onQuickScan: () => void; onSignOut: () => void }) {
  const { t, locale, setLocale } = useOsLocale()
  const s = t.shell
  const pathname = usePathname()
  const [more, setMore] = useState(false)
  const closeMore = useCallback(() => setMore(false), [])
  // Following a link from the sheet closes it (state adjusted during render when the route changes).
  const [shownPath, setShownPath] = useState(pathname)
  if (shownPath !== pathname) { setShownPath(pathname); setMore(false) }

  const isActive = (href: string) => (href === '/os' ? pathname === '/os' : pathname.startsWith(href))
  const tabs = [
    { href: '/os', label: s.today, icon: 'briefing' as const, badge: 0 },
    { href: '/os/inbox', label: s.inbox, icon: 'inbox' as const, badge: status?.needsReply ?? 0, badgeLabel: s.badgeNeedsReply },
    { href: '/os/money', label: s.money, icon: 'audit' as const, badge: status?.money ?? 0 },
    { href: '/os/ask', label: s.max, icon: 'message' as const, badge: 0 },
  ]
  const moreActive = !tabs.some(tab => isActive(tab.href))
  const work = [
    { href: '/os/approvals', label: s.approvals, icon: 'approvals' as const, badge: status?.approvals ?? 0 },
    { href: '/os/invoices', label: t.sidebar.navInvoices, icon: 'invoice' as const },
    { href: '/os/angebote', label: t.sidebar.navAngebote, icon: 'quote' as const },
    { href: '/os/clients', label: t.sidebar.navClients, icon: 'clients' as const },
    { href: '/os/leads', label: t.sidebar.navLeads, icon: 'leads' as const },
    { href: '/os/jobs', label: t.sidebar.navJobs, icon: 'jobs' as const },
    { href: '/os/newsletter', label: t.sidebar.navNewsletter, icon: 'newsletter' as const },
  ]

  return (
    <>
      <nav className="os-bottomnav" aria-label={s.nav}>
        {tabs.map(tab => (
          <Link key={tab.href} href={tab.href} className={`os-tab${isActive(tab.href) ? ' active' : ''}`} aria-current={isActive(tab.href) ? 'page' : undefined}>
            <span className="os-tab-icon"><Icon name={tab.icon} size="md" />{tab.badge > 0 && <span className="os-badge" aria-label={tab.badgeLabel ? tab.badgeLabel(tab.badge) : String(tab.badge)}>{tab.badge > 99 ? '99+' : tab.badge}</span>}</span>
            <span className="os-tab-label">{tab.label}</span>
          </Link>
        ))}
        <button type="button" className={`os-tab${moreActive ? ' active' : ''}`} aria-haspopup="dialog" aria-expanded={more} onClick={() => setMore(true)}>
          <span className="os-tab-icon"><Icon name="menu" size="md" />{(status?.approvals ?? 0) > 0 && <span className="os-badge" aria-label={s.badgeApprovals(status!.approvals)}>{status!.approvals}</span>}</span>
          <span className="os-tab-label">{s.more}</span>
        </button>
      </nav>

      <Sheet open={more} onClose={closeMore} title={s.moreTitle} closeLabel={s.close}>
        <p className="os-more-group">{s.groupWork}</p>
        <ul className="os-more-list">
          {work.map(item => (
            <li key={item.href}>
              <Link href={item.href} className={`os-more-item${isActive(item.href) ? ' active' : ''}`}>
                <Icon name={item.icon} size="md" /><span>{item.label}</span>
                {'badge' in item && (item.badge ?? 0) > 0 && <span className="os-badge os-badge-inline">{item.badge}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <p className="os-more-group">{s.groupAgents}</p>
        <ul className="os-more-list">
          <li><a href={BUREAU_ORIGIN} className="os-more-item" target="_blank" rel="noopener noreferrer"><Icon name="agents" size="md" /><span>{s.agentBureau}<small>{s.agentBureauHint}</small></span><Icon name="external" size="xs" /></a></li>
        </ul>
        <p className="os-more-group">{s.groupTools}</p>
        <ul className="os-more-list">
          <li><button type="button" className="os-more-item" onClick={() => { setMore(false); onQuickScan() }}><Icon name="upload" size="md" /><span>{s.quickScan}</span></button></li>
          <li><a href={WEBSITE_ORIGIN} className="os-more-item" target="_blank" rel="noopener noreferrer"><Icon name="external" size="md" /><span>{s.website}</span></a></li>
        </ul>
        <p className="os-more-group">{s.groupAccount}</p>
        <div className="os-more-account">
          <div role="group" aria-label={s.language} className="os-segment">
            {(['de', 'en'] as const).map(l => <button key={l} type="button" aria-pressed={locale === l} onClick={() => setLocale(l)}>{l === 'de' ? 'Deutsch' : 'English'}</button>)}
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={onSignOut}><Icon name="logout" size="sm" /> {s.signOut}</button>
        </div>
      </Sheet>
    </>
  )
}
