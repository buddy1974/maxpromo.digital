import { token } from '@maxpromo/design-tokens'

/**
 * The OS as an installable app: its own name, start page and scope (/os), standalone display.
 * Separate from the public site's per-domain manifest (app/manifest.ts), which stays a plain
 * bookmark identity with no install. Public (no session) — it holds no business data.
 * Colours come from the token mirror: a manifest is read by the OS, which cannot resolve CSS.
 */
export const dynamic = 'force-static'

export function GET() {
  const manifest = {
    id: '/os',
    name: 'Maxpromo OS',
    short_name: 'Maxpromo',
    description: 'Maxpromo Digital — Business Operating System',
    lang: 'de',
    start_url: '/os',
    scope: '/os',
    display: 'standalone',
    orientation: 'portrait',
    background_color: token.background,
    theme_color: token.background,
    icons: [
      { src: '/images/brand/maxpromo-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/images/brand/maxpromo-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Posteingang', short_name: 'Inbox', url: '/os/inbox' },
      { name: 'Geld', short_name: 'Money', url: '/os/money' },
      { name: 'Frag Max', short_name: 'Max', url: '/os/ask' },
    ],
  }
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
