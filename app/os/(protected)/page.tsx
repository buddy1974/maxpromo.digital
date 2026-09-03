'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useOsLocale } from '@/lib/os-i18n/context'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

interface MetricCardProps { label: string; value: string | number; sub?: string }
function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div style={{
      background: '#111111', borderTop: '2px solid var(--brand-primary)',
      border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', flex: 1,
    }}>
      <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontFamily: grotesk, fontSize: '30px', fontWeight: 700, color: '#FFF', margin: '0 0 4px', letterSpacing: '-0.03em' }}>{value}</p>
      {sub && <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0 }}>{sub}</p>}
    </div>
  )
}

interface Invoice { id: string; invoice_number: string; client_name: string; total: number; status: string; created_at: string }
interface Lead    { id: string; name: string; company: string; source: string; status: string; created_at: string }
interface Job     { id: string; title: string; client_name: string; stage: string; value: number; created_at: string }
interface Client  { id: string }

const STATUS_COLORS: Record<string, string> = {
  draft: '#555', sent: '#3b82f6', paid: '#22c55e', overdue: '#ef4444',
  new: 'var(--brand-primary)', contacted: '#3b82f6', qualified: '#a855f7', converted: '#22c55e', lost: '#ef4444',
  lead: '#555', discovery: '#3b82f6', proposal: '#a855f7', 'in progress': 'var(--brand-primary)',
  review: '#eab308', completed: '#22c55e', invoiced: '#22c55e',
}

/** `label` is the already-translated display string; `status` only drives the colour. */
function Badge({ status, label }: { status: string; label: string }) {
  const color = STATUS_COLORS[status?.toLowerCase()] ?? '#555'
  return (
    <span style={{ fontFamily: mono, fontSize: '9px', color, background: color + '22', padding: '3px 8px', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '2px' }}>
      {label}
    </span>
  )
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{
      fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em',
      color: '#000', background: 'var(--brand-primary)', padding: '10px 18px',
      textDecoration: 'none', textTransform: 'uppercase', fontWeight: 700,
    }}>
      {label}
    </Link>
  )
}

export default function DashboardPage() {
  const { t, intlLocale } = useOsLocale()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [jobs,     setJobs]     = useState<Job[]>([])
  const [clients,  setClients]  = useState<Client[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/os/invoices').then(r => r.json()),
      fetch('/api/os/leads').then(r => r.json()),
      fetch('/api/os/jobs').then(r => r.json()),
      fetch('/api/os/clients').then(r => r.json()),
    ]).then(([inv, lds, jbs, cls]) => {
      setInvoices(Array.isArray(inv) ? inv : [])
      setLeads(Array.isArray(lds) ? lds : [])
      setJobs(Array.isArray(jbs) ? jbs : [])
      setClients(Array.isArray(cls) ? cls : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const hours = new Date().getHours()
  const greeting = hours < 12 ? t.dashboard.greetingMorning
    : hours < 18 ? t.dashboard.greetingAfternoon
    : t.dashboard.greetingEvening

  const today = new Date().toLocaleDateString(intlLocale, {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const outstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + Number(i.total), 0)

  const activeJobs = jobs.filter(j => !['completed', 'invoiced'].includes(j.stage)).length

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const newLeads = leads.filter(l => new Date(l.created_at) > oneWeekAgo).length

  const fmtEur = (n: number) =>
    new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontFamily: grotesk, fontSize: '28px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          {greeting}, {t.dashboard.ownerName}
        </h1>
        <p style={{ fontFamily: mono, fontSize: '11px', color: '#555', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase' }}>
          {today}
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '36px', flexWrap: 'wrap' }}>
        <MetricCard label={t.dashboard.metricClients}     value={loading ? '—' : clients.length}      sub={t.dashboard.metricClientsSub} />
        <MetricCard label={t.dashboard.metricActiveJobs}  value={loading ? '—' : activeJobs}          sub={t.dashboard.metricActiveJobsSub} />
        <MetricCard label={t.dashboard.metricOutstanding} value={loading ? '—' : fmtEur(outstanding)} sub={t.dashboard.metricOutstandingSub} />
        <MetricCard label={t.dashboard.metricNewLeads}    value={loading ? '—' : newLeads}            sub={t.dashboard.metricNewLeadsSub} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <QuickAction href="/os/invoices/new"  label={t.dashboard.actionNewInvoice} />
        <QuickAction href="/os/angebote/new"  label={t.dashboard.actionNewAngebot} />
        <QuickAction href="/os/clients"       label={t.dashboard.actionNewClient} />
        <QuickAction href="/os/jobs"          label={t.dashboard.actionNewJob} />
      </div>

      {/* Activity feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>

        {/* Recent invoices */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid var(--brand-primary)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>{t.dashboard.recentInvoices}</p>
          </div>
          {loading ? (
            <p style={{ padding: '20px', fontFamily: mono, fontSize: '10px', color: '#333' }}>{t.common.loading}</p>
          ) : invoices.length === 0 ? (
            <p style={{ padding: '20px', fontFamily: sans, fontSize: '13px', color: '#444' }}>{t.dashboard.noInvoices}</p>
          ) : (
            invoices.slice(0, 5).map(inv => (
              <div key={inv.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: mono, fontSize: '11px', color: '#FFF' }}>{inv.invoice_number}</span>
                  <Badge status={inv.status} label={t.status.invoice[inv.status] ?? inv.status} />
                </div>
                <p style={{ fontFamily: sans, fontSize: '12px', color: '#555', margin: '3px 0 0' }}>
                  {inv.client_name} · {fmtEur(Number(inv.total))}
                </p>
              </div>
            ))
          )}
          <div style={{ padding: '12px 20px' }}>
            <Link href="/os/invoices" style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-primary)', textDecoration: 'none', letterSpacing: '0.1em' }}>
              {t.dashboard.viewAll}
            </Link>
          </div>
        </div>

        {/* Recent leads */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid var(--brand-primary)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>{t.dashboard.recentLeads}</p>
          </div>
          {loading ? (
            <p style={{ padding: '20px', fontFamily: mono, fontSize: '10px', color: '#333' }}>{t.common.loading}</p>
          ) : leads.length === 0 ? (
            <p style={{ padding: '20px', fontFamily: sans, fontSize: '13px', color: '#444' }}>{t.dashboard.noLeads}</p>
          ) : (
            leads.slice(0, 5).map(lead => (
              <div key={lead.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: sans, fontSize: '12px', color: '#FFF' }}>{lead.name || lead.company || t.dashboard.anonymous}</span>
                  <Badge status={lead.status} label={t.status.lead[lead.status] ?? lead.status} />
                </div>
                <p style={{ fontFamily: mono, fontSize: '10px', color: '#444', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t.status.leadSource[lead.source] ?? lead.source}
                </p>
              </div>
            ))
          )}
          <div style={{ padding: '12px 20px' }}>
            <Link href="/os/leads" style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-primary)', textDecoration: 'none', letterSpacing: '0.1em' }}>
              {t.dashboard.viewAll}
            </Link>
          </div>
        </div>

        {/* Recent jobs */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid var(--brand-primary)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>{t.dashboard.recentJobs}</p>
          </div>
          {loading ? (
            <p style={{ padding: '20px', fontFamily: mono, fontSize: '10px', color: '#333' }}>{t.common.loading}</p>
          ) : jobs.length === 0 ? (
            <p style={{ padding: '20px', fontFamily: sans, fontSize: '13px', color: '#444' }}>{t.dashboard.noJobs}</p>
          ) : (
            jobs.slice(0, 5).map(job => (
              <div key={job.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: sans, fontSize: '12px', color: '#FFF' }}>{job.title}</span>
                  <Badge status={job.stage} label={t.status.jobStage[job.stage] ?? job.stage} />
                </div>
                <p style={{ fontFamily: sans, fontSize: '11px', color: '#555', margin: '3px 0 0' }}>
                  {job.client_name || t.dashboard.noClient}{job.value ? ` · ${fmtEur(Number(job.value))}` : ''}
                </p>
              </div>
            ))
          )}
          <div style={{ padding: '12px 20px' }}>
            <Link href="/os/jobs" style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-primary)', textDecoration: 'none', letterSpacing: '0.1em' }}>
              {t.dashboard.viewKanban}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
