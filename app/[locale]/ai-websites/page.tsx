import { permanentRedirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

/**
 * /ai-websites is the old URL. Canonical is now /services/websites-platforms.
 * 308 permanent redirect, search engines will update their index.
 */
export default async function AIWebsitesRedirect() {
  const locale = await getLocale()
  permanentRedirect(`/${locale}/services/websites-platforms`)
}
