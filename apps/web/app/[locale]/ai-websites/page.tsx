import { permanentRedirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

/**
 * /ai-websites is the old URL. Canonical is /solutions/websites-platforms.
 * 308 permanent redirect, so search engines update their index.
 *
 * This pointed at /services/websites-platforms until the public presentation
 * pass. There is no `services` segment on this site and there never was: the
 * route group is `solutions`. Every visitor arriving on the old URL, and every
 * crawler following it, was permanently redirected to a 404. It was invisible
 * to the audits because a redirect target is not an internal link.
 */
export default async function AIWebsitesRedirect() {
  const locale = await getLocale()
  permanentRedirect(`/${locale}/solutions/websites-platforms`)
}
