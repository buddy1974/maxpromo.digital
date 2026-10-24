/**
 * The OS service worker — deliberately conservative. An authenticated business OS is not a news site:
 *
 *   - It caches exactly one thing: the offline page (/os/offline), which holds no data.
 *   - It never caches, reads or stores an API response, an email, an invoice, a payment or any page
 *     behind the login. Every request goes to the network as if no worker existed.
 *   - Only when a page navigation inside /os fails for lack of a network does it answer with the
 *     offline page, which says so and offers a retry. A failed API call fails visibly in the page.
 *   - A new version takes over on the next load; old caches are removed.
 *
 * Served as a route so it can carry Service-Worker-Allowed (scope /os) and never be cached itself.
 */
export const dynamic = 'force-static'

const VERSION = 'os-sw-1'

const SCRIPT = `
const CACHE = '${VERSION}';
const OFFLINE = '/os/offline';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(new Request(OFFLINE, { cache: 'reload' }))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode !== 'navigate') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !(url.pathname === '/os' || url.pathname.startsWith('/os/'))) return;
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE).then((r) => r || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }))));
});
`

export function GET() {
  return new Response(SCRIPT, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/os',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
