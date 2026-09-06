import type { MetadataRoute } from 'next'
import { resolveDomain } from '@maxpromo/config'
import { token } from '@maxpromo/design-tokens'

/**
 * manifest.webmanifest for agents.maxpromo.digital.
 *
 * Identity only, read from the Domain Registry — the same file the ten hosts
 * served by `apps/web` read. That is the point of the registry living in
 * `@maxpromo/config` rather than inside one application.
 *
 * Colours come from the token package's TypeScript mirror, not from a literal.
 * A manifest is JSON read by the operating system, which cannot resolve a CSS
 * custom property — the same constraint email and PDF generation have, and the
 * same answer they use. The token gate caught the first draft of this file
 * writing #FFFFFF twice, which is precisely what it is for.
 */
const BUREAU = resolveDomain('agents.maxpromo.digital')

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             BUREAU.product,
    short_name:       BUREAU.brand,
    description:      `${BUREAU.product} — ${BUREAU.parentCompany}`,
    lang:             BUREAU.primaryLanguage,
    start_url:        '/',
    display:          'browser',
    background_color: token.background,
    theme_color:      token.background,
    icons: [
      { src: BUREAU.favicon, sizes: 'any', type: 'image/x-icon' },
    ],
  }
}
