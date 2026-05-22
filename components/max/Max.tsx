'use client'

import { useState } from 'react'
import { MaxMemoryProvider } from './MaxMemoryProvider'
import { MaxBubble } from './MaxBubble'
import { MaxPanel } from './MaxPanel'

/**
 * Max — unified chat widget. Mounted in both hub and showcase layouts.
 *
 * State split:
 *   MaxMemoryProvider  → data (session, messages, loading)
 *   Max               → UI (open/closed)
 */
export default function Max() {
  const [open, setOpen] = useState(false)

  return (
    <MaxMemoryProvider>
      {!open && <MaxBubble onClick={() => setOpen(true)} />}
      <MaxPanel open={open} onClose={() => setOpen(false)} />
    </MaxMemoryProvider>
  )
}
