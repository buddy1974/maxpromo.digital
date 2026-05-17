import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Locale-aware navigation primitives.
 *
 * Use these instead of next/link / next/navigation throughout the app
 * so internal links auto-prefix the current locale. Example:
 *
 *   import { Link, useRouter } from '@/i18n/navigation'
 *
 *   <Link href="/services">Services</Link>
 *   // → renders /de/services on a German page,
 *   //   /en/services on an English page.
 *
 * For OS routes and API routes (not localized), keep using next/link.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
