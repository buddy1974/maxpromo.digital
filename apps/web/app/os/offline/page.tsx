import type { Metadata } from 'next'

/**
 * Shown by the OS service worker when a page cannot load for lack of a network. Static, public,
 * bilingual, and empty of data by design: nothing from the business is ever stored on the phone.
 */
export const dynamic = 'force-static'
export const metadata: Metadata = { title: { absolute: 'Offline — Maxpromo OS' }, robots: { index: false, follow: false } }

export default function OfflinePage() {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 'var(--space-5)', background: 'var(--brand-background)', color: 'var(--brand-text)', fontFamily: 'var(--brand-font-body)' }}>
      <div style={{ maxWidth: '420px', display: 'grid', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label-dense)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand-text-muted)' }}>Maxpromo OS</p>
        <section lang="de">
          <h1 style={{ margin: '0 0 var(--space-2)', fontSize: '22px', fontWeight: 'var(--weight-heading)' }}>Keine Verbindung</h1>
          <p style={{ margin: 0, color: 'var(--brand-text-secondary)' }}>Das OS braucht eine Internetverbindung. Auf dem Telefon wird nichts aus deinem Geschäft gespeichert — sobald du wieder online bist, geht es weiter.</p>
        </section>
        <section lang="en">
          <h2 style={{ margin: '0 0 var(--space-2)', fontSize: '17px', fontWeight: 'var(--weight-heading)' }}>No connection</h2>
          <p style={{ margin: 0, color: 'var(--brand-text-secondary)' }}>The OS needs an internet connection. Nothing from your business is stored on this phone — it continues as soon as you are back online.</p>
        </section>
        {/* A full page load on purpose: retrying offline needs the network, not client-side routing. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/os" className="btn-primary" style={{ justifySelf: 'start', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>Erneut versuchen · Try again</a>
      </div>
    </main>
  )
}
