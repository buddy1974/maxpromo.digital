import { HOST_MAP } from './HOST_MAP'
import type { HostResolution } from './types'

const FALLBACK: HostResolution = {
  mode:            'hub',
  slug:            null,
  defaultLocale:   'de',
  useLocalePrefix: true,
}

/**
 * Resolve a raw Host header value to a HostResolution.
 *
 * Normalisation order:
 *   1. Lowercase the entire string
 *   2. Strip trailing `:port`
 *   3. Strip leading `www.`
 *   4. Lookup in HOST_MAP
 *   5. Fallback: *.vercel.app → hub (Vercel preview URLs)
 *   6. Fallback: unknown host → hub, de default
 *
 * Pure function — no side effects. Safe to unit-test in Node.
 */
export function resolveHost(hostHeader: string | null): HostResolution {
  if (!hostHeader) return FALLBACK

  const normalised = hostHeader
    .toLowerCase()
    .replace(/:\d+$/, '')   // strip :port
    .replace(/^www\./, '')  // strip www. prefix

  const resolution = HOST_MAP[normalised]
  if (resolution) return resolution

  // Vercel preview deploys — treat as hub so dev/staging works normally
  if (normalised.endsWith('.vercel.app')) return FALLBACK

  return FALLBACK
}
