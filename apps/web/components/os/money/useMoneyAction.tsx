'use client'
/**
 * One owner Money action on screen (ADR-0025): run the capability; when it prepares an approval,
 * show exactly what will happen (the preview rows) and act only on Marcel's confirmation.
 * Money leaving (refunds) is never one click. The mechanics are the shared owner action.
 */
import { useOwnerAction } from '@/components/os/useOwnerAction'
import type { MoneyCopy } from '@/lib/os-i18n/money'

export function useMoneyAction(copy: MoneyCopy, onDone: () => void) {
  const { run, busy, panel } = useOwnerAction('/api/os/money/actions', copy, () => onDone())
  return { run: (capability: string, input: Record<string, unknown>) => run(capability, input, copy.done).then(() => undefined), busy, panel }
}
