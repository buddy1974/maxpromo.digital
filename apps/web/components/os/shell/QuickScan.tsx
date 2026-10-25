'use client'
/**
 * Quick Scan: a business card photo, screenshot, PDF or pasted signature becomes a client. Opened
 * from the desktop's floating control or the phone's More sheet. It is the client form in its
 * "from a document" mode — one extraction contract, one duplicate check, one save path
 * (client.create) — and opens the new client's page when saved. The form (and its stylesheet) is
 * loaded only when Quick Scan is first opened, so no other screen carries it.
 */
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const ClientForm = dynamic(() => import('@/components/os/clients/ClientForm').then(m => m.ClientForm), { ssr: false })

export function QuickScanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  if (!open) return null
  return <ClientForm open={open} onClose={onClose} onSaved={(client) => { onClose(); router.push(`/os/clients/${client.id}`) }} />
}
