import type { HostResolution } from './types'

/**
 * Host → resolution map.
 *
 * Keys are NORMALISED hostnames (lowercase, no port, no www. prefix).
 * The `resolveHost` function strips all three before lookup, so including
 * explicit www. variants here is redundant but kept for documentation.
 * `localhost:3000` normalises to `localhost` — the bare form is the live key.
 *
 * Wildcard Vercel preview deployments (`*.vercel.app`) are handled in
 * `resolve.ts` after a failed map lookup — not representable as static keys.
 */

const HUB: HostResolution = {
  mode:            'hub',
  slug:            null,
  defaultLocale:   'de',
  useLocalePrefix: true,
}

export const HOST_MAP: Readonly<Record<string, HostResolution>> = {

  // ── Hub ─────────────────────────────────────────────────────────────
  'maxpromo.digital': HUB,
  // www.maxpromo.digital → normalises to maxpromo.digital → HUB
  'localhost':        HUB,
  // localhost:3000    → normalises to localhost          → HUB

  // ── Showcase — German default, NO locale prefix in URL ─────────────
  'restaurant-os.de':  { mode: 'showcase', slug: 'restaurant-os', defaultLocale: 'de', useLocalePrefix: false },
  'superhandwerk.de':  { mode: 'showcase', slug: 'handwerk-os',   defaultLocale: 'de', useLocalePrefix: false },
  'super-praxis.de':   { mode: 'showcase', slug: 'praxis-os',     defaultLocale: 'de', useLocalePrefix: false },
  'smartprintshop.de': { mode: 'showcase', slug: 'printshop-os',  defaultLocale: 'de', useLocalePrefix: false },
  'easy-immo24.de':    { mode: 'showcase', slug: 'realestate-os', defaultLocale: 'de', useLocalePrefix: false },
  'pflege-care24.de':  { mode: 'showcase', slug: 'care-os',       defaultLocale: 'de', useLocalePrefix: false },
  'taxkontrol.de':     { mode: 'showcase', slug: 'taxkontrol',    defaultLocale: 'de', useLocalePrefix: false },

  // ── Showcase — English default, WITH locale prefix (/de, /en) ──────
  'publishers24.org':  { mode: 'showcase', slug: 'publishing-os', defaultLocale: 'en', useLocalePrefix: true  },

} as const
