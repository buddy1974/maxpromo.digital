import { NextResponse, type NextRequest } from 'next/server'
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from '@/lib/i18n/locale'

/**
 * GET /language?to=<locale>&next=<path>
 *
 * Sets the language cookie and sends the visitor back where they were.
 *
 * WHY A ROUTE AND NOT A CLIENT TOGGLE
 * The locale is read on the server, so a client-side state change would render
 * nothing new. This sets the cookie and redirects, which re-renders the same
 * route in the other language — signed in, on the same page, with the same
 * query. A person on the approvals desk who switches to English lands on the
 * approvals desk in English, not on the landing page.
 *
 * WHY `next` IS NOT TRUSTED
 * It decides where a redirect goes, so it is treated as hostile: only a
 * same-origin absolute path is honoured, never a full URL, never a
 * protocol-relative `//host` path. Anything else falls back to the dashboard's
 * own root. An open redirect on a signed-in product is a phishing primitive.
 */
export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to')
  const next = request.nextUrl.searchParams.get('next') ?? '/'

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  const response = NextResponse.redirect(new URL(safeNext, request.nextUrl.origin))

  if (isLocale(to)) {
    response.cookies.set(LOCALE_COOKIE, to, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return response
}
