'use client'
/**
 * One sheet for the OS: a modal panel that rises from the bottom on a phone and sits centred on a
 * desktop. Real dialog semantics (role, label, aria-modal), focus moves in and returns to the opener,
 * Escape and the backdrop close it, the page behind does not scroll. Its height follows the dynamic
 * viewport, so an open keyboard never pushes its actions out of reach.
 */
import { useEffect, useRef } from 'react'
import { Icon } from '@maxpromo/ui'

export function Sheet({ open, onClose, title, closeLabel, children }: { open: boolean; onClose: () => void; title: string; closeLabel: string; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef<Element | null>(null)
  /* The latest close handler, read when needed: a parent that re-renders while the sheet is open (a
     form being typed into) must not re-run the open effect — that moved focus to the close button,
     so the next space typed closed the sheet. */
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement
    const first = panel.current?.querySelector<HTMLElement>('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close.current() }
      if (e.key !== 'Tab' || !panel.current) return
      const items = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])')]
      if (!items.length) return
      const [head, tail] = [items[0], items[items.length - 1]]
      if (e.shiftKey && document.activeElement === head) { e.preventDefault(); tail.focus() }
      else if (!e.shiftKey && document.activeElement === tail) { e.preventDefault(); head.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener.current instanceof HTMLElement) opener.current.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="os-sheet-layer">
      <div className="os-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={panel} className="os-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="os-sheet-head">
          <h2 className="os-sheet-title">{title}</h2>
          <button type="button" className="os-icon-button" onClick={onClose} aria-label={closeLabel}><Icon name="close" size="md" /></button>
        </div>
        <div className="os-sheet-body">{children}</div>
      </div>
    </div>
  )
}
