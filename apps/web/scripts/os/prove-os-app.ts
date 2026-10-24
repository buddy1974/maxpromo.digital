/**
 * The OS as a phone app, offline (no network, no database):
 *   - inbound email links: https only, the visible text is the destination, nothing else is a link
 *   - the installable manifest: own scope (/os), standalone, start page inside the scope
 *   - the service worker: answers only failed /os page navigations with the offline page; never
 *     touches an API request and caches nothing but that page
 *   - the PWA paths the auth gate lets through are exactly these three
 *   - the phone shell keeps Max as a destination and the five places in its bottom navigation
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { linkParts } from '../../components/os/mail/LinkifiedText.tsx'
import { GET as manifestRoute } from '../../app/os/manifest.webmanifest/route.ts'
import { GET as swRoute } from '../../app/os/sw.js/route.ts'

let passed = 0
function check(name: string, ok: boolean) {
  if (!ok) { console.error(`FAIL ${name}`); process.exit(1) }
  passed++; console.log(`PASS ${name}`)
}
const web = resolve(import.meta.dirname, '../..')

/* ── links in inbound mail ── */
const links = (t: string) => linkParts(t).filter(p => p.href)
check('an https address in a sentence becomes one link, without the full stop', (() => { const l = links('Unterlagen: https://example.com/a?b=1. Danke'); return l.length === 1 && l[0].href === 'https://example.com/a?b=1' && l[0].text === 'https://example.com/a?b=1' })())
check('http, javascript:, data: and mailto: are never links', links('http://x.example javascript:alert(1) data:text/html,x mailto:a@b.example').length === 0)
check('the shown text is always the destination (no disguised link)', linkParts('Klick https://bank.example.com/login und https://evil.example').every(p => !p.href || p.href.startsWith(p.text)))
check('a closing bracket after a link stays text', (() => { const p = linkParts('(siehe https://example.com/x)'); return p.some(x => x.href === 'https://example.com/x') && p.some(x => !x.href && x.text === ')') })())
check('a host without a dot is not a link', links('https://localhost/admin').length === 0)
check('text without links comes back unchanged', linkParts('Guten Tag, kein Link hier.').map(p => p.text).join('') === 'Guten Tag, kein Link hier.')

/* ── manifest ── */
const manifest = await manifestRoute().json() as { scope: string; start_url: string; display: string; id: string; icons: { src: string }[] }
check('the OS manifest is its own app: scope /os, start inside it, standalone', manifest.scope === '/os' && manifest.start_url.startsWith(manifest.scope) && manifest.display === 'standalone' && manifest.id === '/os')
check('the manifest icons are the approved brand files', manifest.icons.length >= 2 && manifest.icons.every(i => i.src.startsWith('/images/brand/maxpromo-icon-')))

/* ── service worker ── */
const swResponse = swRoute()
const sw = await swResponse.text()
check('the worker may control /os and is never cached itself', swResponse.headers.get('Service-Worker-Allowed') === '/os' && /no-store/.test(swResponse.headers.get('Cache-Control') ?? ''))
check('it handles page navigations only (an API call is never intercepted)', /if \(req\.mode !== 'navigate'\) return;/.test(sw))
check('…and only inside /os on its own origin', /url\.origin !== self\.location\.origin/.test(sw) && /url\.pathname\.startsWith\('\/os\/'\)/.test(sw))
check('it caches exactly one thing: the offline page', (sw.match(/\.add\(/g) ?? []).length === 1 && /c\.add\(new Request\(OFFLINE/.test(sw) && !/cache\.put|\.put\(/.test(sw))
check('a network answer is passed through untouched; the offline page only replaces a failure', /respondWith\(fetch\(req\)\.catch\(/.test(sw))

/* ── the auth gate's PWA allow-list ── */
const mw = readFileSync(resolve(web, 'middleware.ts'), 'utf8')
const list = mw.match(/const PUBLIC_OS_APP_PATHS = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? ''
check('the auth gate lets exactly the manifest, the worker and the offline page through', JSON.stringify([...list.matchAll(/'([^']+)'/g)].map(m => m[1]).sort()) === JSON.stringify(['/os/manifest.webmanifest', '/os/offline', '/os/sw.js']))

/* ── the phone shell ── */
const shell = readFileSync(resolve(web, 'components/os/shell/PhoneShell.tsx'), 'utf8')
const tabBlock = shell.match(/const tabs = \[([\s\S]*?)\n  \]/)?.[1] ?? ''
const tabs = [...tabBlock.matchAll(/\{ href: '(\/os[^']*)', label: s\.(\w+)/g)].map(m => m[2])
check('the bottom navigation is Today, Inbox, Money, Max (+ More)', JSON.stringify(tabs) === JSON.stringify(['today', 'inbox', 'money', 'max']) && /s\.more/.test(shell))
const css = readFileSync(resolve(web, 'app/os/(protected)/os-layout.css'), 'utf8')
check('on a phone the floating controls and the slide-over are gone by layout, not by padding', /@media \(max-width: 899px\) \{\s*\.os-sidebar, \.os-fab, \.os-askpanel \{ display: none; \}/.test(css))
check('the phone bars respect the safe areas', /env\(safe-area-inset-bottom\)/.test(css) && /env\(safe-area-inset-top\)/.test(css))

console.log(`\nprove-os-app: ${passed} passed`)
