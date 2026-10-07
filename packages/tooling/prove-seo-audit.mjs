#!/usr/bin/env node
/**
 * packages/tooling/prove-seo-audit.mjs
 *
 * audit:seo is only worth running if each of its rules can actually fail.
 *
 * A crawler audit that passes is indistinguishable from one whose regexes
 * stopped matching: both print "clean". So this gate feeds the audit's own
 * check functions a correct page pair — which must pass — and then one broken
 * copy per rule, each of which must produce exactly the finding that rule
 * exists for. Offline, no server, part of `verify`.
 *
 *   node packages/tooling/prove-seo-audit.mjs
 */

import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

const { readPage, checkPage, checkSet, checkSitemap, checkRobots, checkRouting, PROFILES, CANON } = await import(
  pathToFileURL(join(process.cwd(), 'packages', 'tooling', 'audit-seo.mjs')).href,
)

const NOW = Date.parse('2026-10-07T12:00:00Z')
const DE = `${CANON}/de/solutions/web-development`
const EN = `${CANON}/en/solutions/web-development`
const published = new Set([`${CANON}/de/solutions`, `${CANON}/en/solutions`, DE, EN])

const graph = (lang, url) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${CANON}/#organization`, name: 'Maxpromo Digital', url: CANON,
      address: { '@type': 'PostalAddress', addressLocality: 'Essen', addressCountry: 'DE' }, founder: { '@id': `${CANON}/#founder` } },
    { '@type': 'Person', '@id': `${CANON}/#founder`, name: 'Marcel Akwe', worksFor: { '@id': `${CANON}/#organization` } },
    { '@type': 'WebSite', '@id': `${CANON}/#website`, url: CANON, publisher: { '@id': `${CANON}/#organization` } },
  ],
}) + '</script><script type="application/ld+json">' + JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Service', '@id': `${url}#service`, name: 'Web', url, provider: { '@id': `${CANON}/#organization` } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${CANON}/${lang}` },
      { '@type': 'ListItem', position: 2, name: 'Solutions', item: `${CANON}/${lang}/solutions` },
      { '@type': 'ListItem', position: 3, name: 'Web', item: url },
    ] },
  ],
})

function page(lang, url, o = {}) {
  const t = o.title ?? (lang === 'de' ? 'Webentwicklung | Maxpromo Digital' : 'Web development | Maxpromo Digital')
  const d = o.description ?? (lang === 'de'
    ? 'Eine Website, die Anfragen annimmt, sortiert und weitergibt, statt sie nur entgegenzunehmen und liegen zu lassen.'
    : 'A website that takes an enquiry, sorts it and passes it on, rather than only receiving it and leaving it there.')
  const meta = (a, k, v) => (v === null ? '' : `<meta ${a}="${k}" content="${v}"/>`)
  const img = o.image ?? `${CANON}/og?title=Web&amp;family=capability&amp;locale=${lang}`
  return `<!DOCTYPE html><html lang="${o.lang ?? lang}"><head><title>${t}</title>`
    + meta('name', 'description', o.desc === null ? null : d)
    + (o.robots ? meta('name', 'robots', o.robots) : '')
    + (o.canonical === null ? '' : `<link rel="canonical" href="${o.canonical ?? url}"/>`)
    + (o.noDe ? '' : `<link rel="alternate" hrefLang="de" href="${o.hrefDe ?? DE}"/>`)
    + `<link rel="alternate" hrefLang="en" href="${o.hrefEn ?? EN}"/>`
    + `<link rel="alternate" hrefLang="x-default" href="${o.xdefault ?? DE}"/>`
    + meta('property', 'og:title', t) + meta('property', 'og:description', d)
    + meta('property', 'og:url', o.ogUrl ?? url) + meta('property', 'og:site_name', 'Maxpromo Digital')
    + meta('property', 'og:locale', o.ogLocale ?? (lang === 'de' ? 'de_DE' : 'en_GB'))
    + meta('property', 'og:image', o.ogImage === undefined ? img : o.ogImage) + meta('property', 'og:type', 'website')
    + meta('name', 'twitter:card', 'summary_large_image') + meta('name', 'twitter:title', t)
    + meta('name', 'twitter:description', d) + meta('name', 'twitter:image', img)
    + (o.headExtra ?? '')
    + `<script type="application/ld+json">${o.ld ?? graph(lang, url)}</script>`
    + `</head><body>${o.noH1 ? '' : '<h1>Web</h1>'}<footer>${o.footer ?? 'Essen · Deutschland'}</footer></body></html>`
}

const run = (lang, url, o, headers) => checkPage({ url, page: readPage(page(lang, url, o)), headers, published, now: NOW })

const results = []
const prove = (name, findings, expect) => {
  const ok = expect === null ? findings.length === 0 : findings.some((f) => f.includes(expect))
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      expected ${expect === null ? 'no findings' : `"${expect}"`}, got: ${JSON.stringify(findings)}`}`)
}

const swapLd = (fn) => {
  const parts = graph('de', DE).split('</script><script type="application/ld+json">').map((p) => JSON.parse(p))
  fn(parts)
  return parts.map((p) => JSON.stringify(p)).join('</script><script type="application/ld+json">')
}

// The correct page pair: the baseline every mutation departs from.
prove('a correct DE page passes', run('de', DE), null)
prove('a correct EN page passes', run('en', EN), null)
prove('a correct pair passes the set rules', checkSet([
  { url: DE, lang: 'de', page: readPage(page('de', DE)) },
  { url: EN, lang: 'en', page: readPage(page('en', EN)) },
]), null)

// Head
prove('missing description', run('de', DE, { desc: null }), 'missing description')
prove('missing canonical', run('de', DE, { canonical: null }), 'missing canonical')
prove('canonical on the wrong host', run('de', DE, { canonical: 'https://maxpromo.digital/de/solutions/web-development' }), 'canonical is')
prove('canonical pointing at another page', run('de', DE, { canonical: `${CANON}/de` }), 'canonical is')
prove('og:url is the homepage', run('de', DE, { ogUrl: CANON }), 'og:url is')
prove('missing og:image', run('de', DE, { ogImage: null }), 'missing og:image')
prove('relative og:image', run('de', DE, { ogImage: '/images/seo/card.png' }), 'og:image is not absolute')
prove('og:image on a preview host', run('de', DE, { ogImage: 'https://maxpromo-git-x.vercel.app/og.png' }), 'og:image is not absolute')
prove('wrong <html lang>', run('de', DE, { lang: 'en' }), '<html lang>')
prove('wrong og:locale', run('en', EN, { ogLocale: 'en_US' }), 'og:locale')
prove('noindex on a published page', run('de', DE, { robots: 'noindex' }), 'robots')
prove('nofollow on a published page', run('de', DE, { robots: 'index, nofollow' }), 'robots')
prove('X-Robots-Tag noindex header', run('de', DE, {}, { 'x-robots-tag': 'noindex' }), 'X-Robots-Tag')
prove('no h1', run('de', DE, { noH1: true }), 'no <h1>')
prove('localhost in the head', run('de', DE, { headExtra: '<link rel="preconnect" href="http://localhost:3020"/>' }), 'head contains localhost')

// Titles
prove('title over budget', run('de', DE, { title: `${'Sehr langer Titel, '.repeat(4)}| Maxpromo Digital` }), 'budget')
prove('brand twice', run('de', DE, { title: 'Web | Maxpromo Digital | Maxpromo Digital' }), 'brand twice')
prove('description too short', run('de', DE, { description: 'Zu kurz.' }), 'description is')
prove('description too long', run('de', DE, { description: 'x'.repeat(200) }), 'description is')
prove('duplicate titles in one language', checkSet([
  { url: DE, lang: 'de', page: readPage(page('de', DE)) },
  { url: `${CANON}/de/solutions`, lang: 'de', page: readPage(page('de', `${CANON}/de/solutions`)) },
]), 'title duplicates')

// Languages
prove('missing hreflang de', run('en', EN, { noDe: true }), 'missing hreflang de')
prove('hreflang to an unpublished URL', run('de', DE, { hrefEn: `${CANON}/en/web` }), 'not a published URL')
prove('hreflang en into the German folder', run('de', DE, { hrefEn: `${CANON}/de/solutions` }), 'another language')
prove('hreflang not self-referencing', run('de', DE, { hrefDe: `${CANON}/de/solutions` }), 'does not point at the page itself')
prove('x-default not the German page', run('de', DE, { xdefault: EN }), 'x-default')
prove('non-reciprocal pair', checkSet([
  { url: DE, lang: 'de', page: readPage(page('de', DE)) },
  { url: EN, lang: 'en', page: readPage(page('en', EN, { hrefDe: `${CANON}/de/solutions` })) },
]), 'does not point back')

// Schema
prove('JSON-LD that does not parse', run('de', DE, { ld: '{"@context": ' }), 'does not parse')
prove('a second Organization', run('de', DE, { ld: swapLd((p) => p[1]['@graph'].push({ '@type': 'Organization', '@id': `${CANON}/#organization`, name: 'x' })) }), 'Organization nodes')
prove('Organization without the stable @id', run('de', DE, { ld: swapLd((p) => { p[0]['@graph'][0]['@id'] = `${CANON}/#org` }) }), 'Organization @id')
prove('founder missing', run('de', DE, { ld: swapLd((p) => p[0]['@graph'].splice(1, 1)) }), 'founder Person')
prove('dangling @id reference', run('de', DE, { ld: swapLd((p) => p[0]['@graph'].splice(1, 1)) }), 'which the page does not define')
prove('LocalBusiness', run('de', DE, { ld: swapLd((p) => { p[0]['@graph'][0]['@type'] = ['Organization', 'LocalBusiness'] }) }), 'declares LocalBusiness')
prove('street address in schema', run('de', DE, { ld: swapLd((p) => { p[0]['@graph'][0].address.streetAddress = 'Musterweg 1' }) }), 'streetAddress')
prove('geo coordinates', run('de', DE, { ld: swapLd((p) => { p[0]['@graph'][0].geo = { latitude: 51, longitude: 7 } }) }), 'geo')
prove('an offer with a price', run('de', DE, { ld: swapLd((p) => { p[1]['@graph'][0].offers = { price: '990' } }) }), 'offers')
prove('a rating', run('de', DE, { ld: swapLd((p) => { p[0]['@graph'][0].aggregateRating = { ratingValue: 5 } }) }), 'aggregateRating')
prove('a SearchAction', run('de', DE, { ld: swapLd((p) => { p[0]['@graph'][2].potentialAction = { '@type': 'SearchAction' } }) }), 'potentialAction')
prove('breadcrumb ending elsewhere', run('de', DE, { ld: swapLd((p) => { p[1]['@graph'][1].itemListElement.pop() }) }), 'BreadcrumbList ends')
prove('breadcrumb through an unpublished page', run('de', DE, { ld: swapLd((p) => { p[1]['@graph'][1].itemListElement[1].item = `${CANON}/de/leistungen` }) }), 'not a published page')
prove('Service without the provider', run('de', DE, { ld: swapLd((p) => { delete p[1]['@graph'][0].provider }) }), 'Service provider')
prove('Service for another URL', run('de', DE, { ld: swapLd((p) => { p[1]['@graph'][0].url = `${CANON}/de` }) }), 'Service url')
prove('article dated in the future', run('de', DE, { ld: swapLd((p) => p[1]['@graph'].push({ '@type': 'BlogPosting', datePublished: '2030-01-01', author: { '@id': `${CANON}/#organization` }, publisher: { '@id': `${CANON}/#organization` }, mainEntityOfPage: DE })) }), 'not a real past date')
prove('article without a date', run('de', DE, { ld: swapLd((p) => p[1]['@graph'].push({ '@type': 'Article', author: { '@id': `${CANON}/#founder` }, publisher: { '@id': `${CANON}/#organization` }, mainEntityOfPage: DE })) }), 'not a real past date')

// Leaks
prove('street address in the footer', run('de', DE, { footer: 'Körnerstr. 8, 45143 Essen' }), 'street address')
prove('street address allowed on the Impressum', checkPage({
  url: `${CANON}/de/impressum`,
  page: readPage(page('de', `${CANON}/de/impressum`, { footer: 'Körnerstr. 8', hrefDe: `${CANON}/de/impressum`, hrefEn: `${CANON}/en/impressum`, xdefault: `${CANON}/de/impressum`, ld: graph('de', `${CANON}/de/impressum`).split('</script>')[0] })),
  published: new Set([...published, `${CANON}/de/impressum`, `${CANON}/en/impressum`]), now: NOW,
}).filter((f) => f.includes('street')), null)

// Sitemap and robots
const sm = (loc, lastmod = '') => `<urlset><url><loc>${loc}</loc>${lastmod && `<lastmod>${lastmod}</lastmod>`}</url></urlset>`
prove('a clean sitemap entry', checkSitemap(sm(DE, '2026-05-01T00:00:00.000Z'), NOW).failures, null)
prove('lastmod stamped with the request time', checkSitemap(sm(DE, new Date(NOW - 1000).toISOString()), NOW).failures, 'request time')
prove('lastmod in the future', checkSitemap(sm(DE, '2031-01-01'), NOW).failures, 'future')
prove('private route in the sitemap', checkSitemap(sm(`${CANON}/de/portfolio`), NOW).failures, 'private route')
prove('sitemap on a preview host', checkSitemap(sm('https://maxpromo.vercel.app/de'), NOW).failures, 'not on the canonical host')
prove('URL listed twice', checkSitemap(`<urlset><url><loc>${DE}</loc></url><url><loc>${DE}</loc></url></urlset>`, NOW).failures, 'listed twice')
const robots = `User-Agent: *\nAllow: /\nDisallow: /os\nDisallow: /api/\nDisallow: /demo\nDisallow: /portfolio\nDisallow: /data-deletion\nSitemap: ${CANON}/sitemap.xml\n`
prove('a clean robots.txt', checkRobots(robots), null)
prove('a site-wide disallow', checkRobots(`${robots}Disallow: /\n`), 'whole site')
prove('robots.txt without the sitemap', checkRobots(robots.replace(/Sitemap.*\n/, '')), 'canonical sitemap')
prove('robots.txt exposing /os', checkRobots(robots.replace('Disallow: /os\n', '')), '/os')

// Routing (Iteration 2A.1): one destination per unprefixed URL, whoever asks.
const rec = (o) => ({ profile: 'curl', setCookie: null, link: null, location: null, contentType: null, ...o })
const goodRouting = [
  ...Object.keys(PROFILES).map((profile) => rec({ kind: 'unprefixed', path: '/', profile, status: 308, location: '/de' })),
  ...Object.keys(PROFILES).map((profile) => rec({ kind: 'unprefixed', path: '/solutions', profile, status: 308, location: 'https://www.maxpromo.digital/de/solutions?utm_source=x' })),
  rec({ kind: 'page', path: '/de/solutions', status: 200, link: '</_next/static/media/a.woff2>; rel=preload; as="font"' }),
  rec({ kind: 'machine', path: '/robots.txt', status: 200, contentType: 'text/plain', expect: 'text/plain' }),
  rec({ kind: 'machine', path: '/sitemap.xml', status: 200, contentType: 'application/xml', expect: 'xml' }),
  rec({ kind: 'endpoint', path: '/api/health', status: 503, contentType: 'application/json', expect: 'json' }),
]
prove('correct routing passes', checkRouting(goodRouting), null)
prove('unprefixed URL rendering as a duplicate 200', checkRouting([rec({ kind: 'unprefixed', path: '/', status: 200 })]), 'not a permanent 308')
prove('temporary 307 instead of permanent', checkRouting([rec({ kind: 'unprefixed', path: '/', status: 307, location: '/de' })]), 'not a permanent 308')
prove('Accept-Language choosing the destination', checkRouting([rec({ kind: 'unprefixed', path: '/', profile: 'chrome-en', status: 308, location: '/en' })]), 'not /de')
prove('Googlebot sent somewhere else', checkRouting([rec({ kind: 'unprefixed', path: '/solutions', profile: 'googlebot', status: 308, location: '/en/solutions' })]), 'not /de/solutions')
prove('locale cookie set', checkRouting([rec({ kind: 'page', path: '/de', status: 200, setCookie: 'NEXT_LOCALE=de; Path=/' })]), 'NEXT_LOCALE')
prove('HTTP Link header with hreflang alternates', checkRouting([rec({ kind: 'page', path: '/de', status: 200, link: '<https://www.maxpromo.digital/>; rel="alternate"; hreflang="x-default"' })]), 'Link header')
prove('locale page not 200', checkRouting([rec({ kind: 'page', path: '/de/solutions', status: 404 })]), 'answers 404')
prove('robots.txt redirected into a locale', checkRouting([rec({ kind: 'machine', path: '/robots.txt', status: 307, location: '/de/robots.txt', expect: 'text/plain' })]), 'answers 307')
prove('sitemap served as HTML', checkRouting([rec({ kind: 'machine', path: '/sitemap.xml', status: 200, contentType: 'text/html', expect: 'xml' })]), 'expected xml')
prove('API route locale-redirected', checkRouting([rec({ kind: 'endpoint', path: '/api/health', status: 308, location: '/de/api/health', expect: 'json' })]), 'API route redirected')
prove('static asset locale-redirected', checkRouting([rec({ kind: 'machine', path: '/logo.png', status: 307, location: '/de/logo.png', expect: 'image/png' })]), 'answers 307')

const failed = results.filter((r) => !r).length
console.log('='.repeat(74))
if (failed) {
  console.log(`SEO AUDIT: ${failed} of ${results.length} rule(s) did not behave as proved`)
  process.exitCode = 1
} else {
  console.log(`SEO AUDIT: clean — ${results.length} propert(ies) proved: every rule passes a correct page and fails its defect`)
}
