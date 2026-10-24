'use client'
/**
 * The invoice's business transitions, and only the valid ones (ADR-0025):
 *
 *   draft      → delete (inline confirmation) · cancel
 *   sent/overdue → record a payment · payment reminder · cancel (only while no money is recorded)
 *   paid       → nothing here; refunds live in the payment ledger
 *   cancelled  → nothing; it stays on record
 *
 * Recording, reminders and cancelling are governed capabilities: each prepares an approval whose
 * preview says exactly what happens, and acts only on Marcel's confirmation. No native dialogs.
 */
import { useState } from 'react'
import { useOsLocale } from '@/lib/os-i18n/context'
import { MONEY_COPY } from '@/lib/os-i18n/money'
import { useMoneyAction } from './useMoneyAction'
import { formatMoney } from './InvoiceMoneyPanel'

type Open = null | 'record' | 'cancel' | 'delete'

export function InvoiceActions({ invoice, onChanged, onDeleted }: {
  invoice: { id: string; status: string; currency?: string | null; open: number; received: number }
  onChanged: () => void
  onDeleted: () => void
}) {
  const { locale } = useOsLocale()
  const c = MONEY_COPY[locale]
  const [open, setOpen] = useState<Open>(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [reason, setReason] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const action = useMoneyAction(c, () => { setOpen(null); onChanged() })
  const currency = invoice.currency || 'EUR'
  const fmt = (v: number) => formatMoney(v, currency, locale)
  const s = invoice.status

  if (s === 'paid' || s === 'cancelled') {
    return <p style={{ margin: 'var(--space-3) 0 0', color: 'var(--brand-text-secondary)', fontSize: 'var(--text-small)' }}>{s === 'paid' ? c.paidNote : c.cancelledNote}</p>
  }

  const issued = s === 'sent' || s === 'overdue'
  const canCancel = invoice.received <= 0.009

  async function removeDraft() {
    setDeleting(true); setDeleteError('')
    const res = await fetch(`/api/os/invoices?id=${invoice.id}`, { method: 'DELETE' })
    if (res.ok) { onDeleted(); return }
    setDeleting(false)
    setDeleteError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? c.failed)
  }

  const toggle = (next: Open) => () => { setOpen(o => (o === next ? null : next)); setAmount(String(invoice.open)); setMethod(''); setReason(''); setDeleteError('') }
  const field: React.CSSProperties = { minHeight: '44px', fontSize: '16px', width: '100%' }

  return (
    <section aria-label={c.actions} className="invoice-actions">
      <div className="invoice-actions-row">
        {issued && invoice.open > 0 && <button type="button" className="btn-primary btn-sm" aria-expanded={open === 'record'} onClick={toggle('record')}>{c.recordPayment}</button>}
        {s === 'overdue' && <button type="button" className="btn-secondary btn-sm" disabled={action.busy} onClick={() => void action.run('reminder.send', { invoice_id: invoice.id })}>{c.sendReminder}</button>}
        {canCancel && <button type="button" className="btn-secondary btn-sm" aria-expanded={open === 'cancel'} onClick={toggle('cancel')}>{c.cancelInvoice}</button>}
        {s === 'draft' && <button type="button" className="btn-secondary btn-sm invoice-actions-danger" aria-expanded={open === 'delete'} onClick={toggle('delete')}>{c.deleteDraft}</button>}
      </div>
      {!canCancel && <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--brand-text-secondary)', fontSize: 'var(--text-small)' }}>{c.refundFirst(fmt(invoice.received))}</p>}

      {open === 'record' && (
        <form className="invoice-actions-form" onSubmit={e => { e.preventDefault(); void action.run('payment.record', { invoice_id: invoice.id, amount: Number(amount), ...(method.trim() ? { method: method.trim() } : {}) }) }}>
          <label><span>{c.recordAmount}</span><input className="input" type="number" inputMode="decimal" step="0.01" min="0.01" max={invoice.open} value={amount} onChange={e => setAmount(e.target.value)} required style={field} /></label>
          <label><span>{c.recordMethod}</span><input className="input" type="text" maxLength={60} value={method} onChange={e => setMethod(e.target.value)} style={field} /></label>
          <div className="invoice-actions-row">
            <button type="submit" className="btn-primary btn-sm" disabled={action.busy}>{c.recordPayment}</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(null)}>{c.cancel}</button>
          </div>
        </form>
      )}

      {open === 'cancel' && (
        <form className="invoice-actions-form" onSubmit={e => { e.preventDefault(); void action.run('invoice.cancel', { invoice_id: invoice.id, reason: reason.trim() }) }}>
          <p style={{ margin: 0, fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)' }}>{c.cancelHint}</p>
          <label><span>{c.cancelReason}</span><input className="input" type="text" minLength={3} maxLength={300} value={reason} onChange={e => setReason(e.target.value)} required style={field} /></label>
          <div className="invoice-actions-row">
            <button type="submit" className="btn-primary btn-sm" disabled={action.busy || reason.trim().length < 3}>{c.cancelInvoice}</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(null)}>{c.cancel}</button>
          </div>
        </form>
      )}

      {open === 'delete' && (
        <div className="invoice-actions-form" role="group" aria-label={c.deleteConfirm}>
          <p style={{ margin: 0 }}>{c.deleteConfirm}</p>
          <div className="invoice-actions-row">
            <button type="button" className="btn-primary btn-sm invoice-actions-danger" disabled={deleting} onClick={() => void removeDraft()}>{c.deleteYes}</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(null)}>{c.cancel}</button>
          </div>
          {deleteError && <p role="alert" style={{ margin: 0, color: 'var(--semantic-danger)' }}>{deleteError}</p>}
        </div>
      )}
      {action.panel}
    </section>
  )
}
