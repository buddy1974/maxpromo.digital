'use client'

import { useState, useEffect } from 'react'
import { MaxMemoryProvider } from './MaxMemoryProvider'
import { MaxBubble } from './MaxBubble'
import { MaxPanel } from './MaxPanel'
import { OPEN_MAX_CHAT } from '@/lib/events'

/**
 * Max — unified chat widget. Mounted in both hub and showcase layouts.
 *
 * State split:
 *   MaxMemoryProvider  → data (session, messages, loading)
 *   Max               → UI (open/closed)
 *
 * open-max-chat event: fired by MobileStickyCTA and any other surface
 * that needs to open Max programmatically.
 */
export default function Max() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_MAX_CHAT, onOpen)
    return () => window.removeEventListener(OPEN_MAX_CHAT, onOpen)
  }, [])

  return (
    <MaxMemoryProvider>
      {!open && <MaxBubble onClick={() => setOpen(true)} />}
      <MaxPanel open={open} onClose={() => setOpen(false)} />
    </MaxMemoryProvider>
  )
}
