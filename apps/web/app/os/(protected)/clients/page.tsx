'use client'
/**
 * Clients — the working list. One row per client on every width (a phone gets the same list, not
 * a squeezed table); a row opens the client page. Active and archived are two tabs: archiving takes
 * a client out of the working list without touching its history. Every write happens through the
 * client capabilities (ClientForm, client page).
 */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useOsLocale } from '@/lib/os-i18n/context'
import { CLIENTS_COPY } from '@/lib/os-i18n/clients'
import { ClientForm, type ClientRecord } from '@/components/os/clients/ClientForm'
import '@/components/os/clients/clients.css'

interface Row extends ClientRecord { open_invoices: number; open_quotes: number }

export default function ClientsPage() {
  const { locale } = useOsLocale()
  const c = CLIENTS_COPY[locale]
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const params = useSearchParams()
  const router = useRouter()
  /* /os/clients?new=1 opens the form straight away. */
  const [formOpen, setFormOpen] = useState(() => params.get('new') === '1')

  useEffect(() => {
    let live = true
    fetch(`/api/os/clients${tab === 'archived' ? '?archived=1' : ''}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((d: Row[]) => { if (live) { setRows(Array.isArray(d) ? d : []); setError(false) } })
      .catch(() => { if (live) setError(true) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [tab])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => [r.name, r.company, r.email, r.phone, r.city, r.postcode, r.website].some(v => (v ?? '').toLowerCase().includes(q)))
  }, [rows, search])

  const place = (r: Row) => [r.postcode, r.city].filter(Boolean).join(' ')

  return (
    <div className="clients-page">
      <header className="clients-head">
        <div>
          <h1>{c.heading}</h1>
          <p className="clients-count">{rows.length}</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>+ {c.newClient}</button>
      </header>

      <div className="clients-tools">
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={c.search} aria-label={c.search} />
        <div className="clients-tabs" role="tablist">
          {(['active', 'archived'] as const).map(k => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setLoading(true); setTab(k) }}>
              {k === 'active' ? c.tabActive : c.tabArchived}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="clients-empty">{c.loading}</p>
        : error ? <p className="clients-empty" role="alert">{c.failed}</p>
        : filtered.length === 0 ? <p className="clients-empty">{tab === 'archived' ? c.emptyArchived : c.empty}</p>
        : (
          <ul className="clients-list">
            {filtered.map(r => (
              <li key={r.id}>
                <Link href={`/os/clients/${r.id}`} className="clients-row">
                  <div className="clients-row-main">
                    <p className="clients-row-title">{r.company || r.name}</p>
                    <p className="clients-row-meta">{[r.company ? r.name : null, r.email, r.phone].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="clients-row-side">
                    {place(r) && <span>{place(r)}</span>}
                    {r.open_invoices > 0 && <span className="clients-flag">{c.openInvoices(r.open_invoices)}</span>}
                    {r.open_quotes > 0 && <span className="clients-flag">{c.openQuotes(r.open_quotes)}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

      <ClientForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={(client) => router.push(`/os/clients/${client.id}`)} />
    </div>
  )
}
