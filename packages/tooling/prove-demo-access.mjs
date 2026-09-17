#!/usr/bin/env node
/**
 * packages/tooling/prove-demo-access.mjs
 *
 * The ADR-0004 harness for the private demonstration room.
 *
 *   npm run prove:demo-access
 *
 * The room ships empty and shut, which means the one thing nobody can learn by
 * looking at it is whether its lock works. A gate that has only ever been seen
 * passing is not known to block — and this gate is the only thing between a
 * stranger with a URL and a client's system running in front of them.
 *
 * So every way in is tried, against the real module, and every one of them has
 * to be refused:
 *
 *   no cookie · a forged cookie · a cookie signed with a different secret ·
 *   a tampered payload · an expired session · a revoked grant · a grant past
 *   its own date · a valid grant reaching for a demo it was not granted ·
 *   a wrong token · no token · a token for a different grant
 *
 * And one thing has to be allowed, because a lock that refuses everybody is
 * not a lock, it is a wall: the correct token for a live grant opens the demo
 * that grant names, and only that one.
 *
 * WHAT IS REAL HERE AND WHAT IS A FIXTURE
 * The code under test is apps/web/lib/demo/access.ts itself — the same file
 * the site imports, not a copy. The grants are fixtures, passed through the
 * `lookup` parameter those functions accept for this purpose, because the
 * registry ships empty and a harness that edited it to run would be proving
 * something about a file it had just changed.
 *
 * The secret is a throwaway generated per run. Nothing here reads, needs or
 * prints the production secret.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import { randomBytes } from 'node:crypto'

const ROOT = process.cwd()
const ACCESS = join(ROOT, 'apps', 'web', 'lib', 'demo', 'access.ts')
const REGISTRY = join(ROOT, 'apps', 'web', 'lib', 'demo', 'registry.ts')

for (const p of [ACCESS, REGISTRY]) {
  if (!existsSync(p)) {
    console.error(`prove:demo-access: missing ${p}`)
    console.error('Refusing to report a boundary proved without having loaded it.')
    process.exit(1)
  }
}

/* The application's TypeScript imports its siblings without a file extension,
   which Node's resolver will not do on its own. Resolving it here keeps the
   harness pointed at the real file instead of a transpiled copy of it. */
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (specifier.startsWith('.')) return nextResolve(`${specifier}.ts`, context)
      throw error
    }
  },
})

/* Set before the module is loaded: the room is shut when no secret is set, and
   a harness that proved a shut room refuses everything would prove nothing. */
const SECRET = randomBytes(32).toString('hex')
process.env.DEMO_ACCESS_SECRET = SECRET

const access = await import(pathToFileURL(ACCESS).href)
const registry = await import(pathToFileURL(REGISTRY).href)

const {
  demoToken, verifyDemoToken, signDemoSession, resolveDemoSession, sessionAuthorises,
  buildDemoCookie, demoRoomIsClosed,
} = access

/* ── Fixtures ────────────────────────────────────────────────────────────── */

const day = 24 * 60 * 60 * 1000
const iso = (offsetDays) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10)

const LIVE = {
  id: 'g-live', company: 'Fixture GmbH', demos: ['d-allowed'],
  issued: iso(-1), expires: iso(30), status: 'active',
}
const REVOKED = { ...LIVE, id: 'g-revoked', status: 'revoked' }
const PAST = { ...LIVE, id: 'g-past', expires: iso(-1) }
const UNDATED = { ...LIVE, id: 'g-undated', expires: 'whenever' }

const GRANTS = [LIVE, REVOKED, PAST, UNDATED]
const lookup = (id) => GRANTS.find((g) => g.id === id)

let failed = 0
let proved = 0
const line = (ok, label, note) => {
  proved++
  if (!ok) failed++
  console.log(`${ok ? '  ' : '!!'} ${ok ? 'refused/allowed as required' : 'DID NOT BEHAVE'}  ${label}${note ? `  — ${note}` : ''}`)
}
/** The room must say no. */
const refuses = async (label, promise) => line((await promise) === null || (await promise) === false, label)
/** The room must say yes, or the lock is a wall. */
const allows = async (label, promise) => {
  const value = await promise
  line(value !== null && value !== false && value !== undefined, label)
  return value
}

console.log('='.repeat(74))
console.log('DEMO ACCESS — the boundary, exercised')
console.log('='.repeat(74))

/* ── 0. The room is open at all during this run ──────────────────────────── */

line(demoRoomIsClosed() === false, 'a configured secret opens the room', 'otherwise everything below is vacuous')

/* ── 1. The token exchange ───────────────────────────────────────────────── */

console.log('\nTOKEN EXCHANGE')
const liveToken = await demoToken(LIVE.id)
line(typeof liveToken === 'string' && liveToken.length > 20, 'a grant has a token')

await allows('the right token for a live grant is accepted', verifyDemoToken(LIVE.id, liveToken, lookup))
await refuses('no token at all', verifyDemoToken(LIVE.id, undefined, lookup))
await refuses('an empty token', verifyDemoToken(LIVE.id, '', lookup))
await refuses('a wrong token', verifyDemoToken(LIVE.id, 'not-the-token', lookup))
await refuses('a token of the right shape but the wrong value',
  verifyDemoToken(LIVE.id, liveToken.slice(0, -1) + (liveToken.endsWith('A') ? 'B' : 'A'), lookup))
await refuses("another grant's token", verifyDemoToken(LIVE.id, await demoToken(REVOKED.id), lookup))
await refuses('a grant that does not exist', verifyDemoToken('g-nope', await demoToken('g-nope'), lookup))
await refuses('a revoked grant, with its own valid token',
  verifyDemoToken(REVOKED.id, await demoToken(REVOKED.id), lookup))
await refuses('a grant past its expiry date, with its own valid token',
  verifyDemoToken(PAST.id, await demoToken(PAST.id), lookup))
await refuses('a grant whose expiry date does not parse',
  verifyDemoToken(UNDATED.id, await demoToken(UNDATED.id), lookup))

/* ── 2. The session cookie ───────────────────────────────────────────────── */

console.log('\nSESSION COOKIE')
const liveCookie = await signDemoSession(LIVE.id)
await allows('a cookie this server signed, for a live grant', resolveDemoSession(liveCookie, lookup))
await refuses('no cookie', resolveDemoSession(undefined, lookup))
await refuses('an empty cookie', resolveDemoSession('', lookup))
await refuses('a cookie that is not two parts', resolveDemoSession('justonepart', lookup))
await refuses('a cookie with a forged signature', resolveDemoSession(`${liveCookie.split('.')[0]}.forged`, lookup))
await refuses('a cookie whose payload was edited after signing',
  resolveDemoSession(`${Buffer.from(JSON.stringify({ g: LIVE.id, exp: 9e9 })).toString('base64url')}.${liveCookie.split('.')[1]}`, lookup))
await refuses('a cookie whose body is not JSON',
  resolveDemoSession(`${Buffer.from('not json').toString('base64url')}.${liveCookie.split('.')[1]}`, lookup))
await refuses('a cookie for a grant that was revoked after it was issued',
  resolveDemoSession(await signDemoSession(REVOKED.id), lookup))
await refuses('a cookie for a grant that has since passed its date',
  resolveDemoSession(await signDemoSession(PAST.id), lookup))
await refuses('a cookie for a grant that no longer exists',
  resolveDemoSession(await signDemoSession('g-nope'), lookup))

/* An expired session, built the way the module builds one, then aged. The
   payload is re-signed with the real secret, so this is the expiry check being
   exercised and not the signature check standing in for it. */
const expiredBody = Buffer.from(JSON.stringify({ g: LIVE.id, exp: Math.floor(Date.now() / 1000) - 60 })).toString('base64url')
const expiredSig = await (async () => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(expiredBody)))
  return Buffer.from(bytes).toString('base64url')
})()
await refuses('a correctly signed session that has expired', resolveDemoSession(`${expiredBody}.${expiredSig}`, lookup))

/* ── 3. A cookie signed with a different secret ──────────────────────────── */

console.log('\nA DIFFERENT SECRET')
process.env.DEMO_ACCESS_SECRET = randomBytes(32).toString('hex')
await refuses('yesterday\'s cookie after the secret is rotated', resolveDemoSession(liveCookie, lookup))
process.env.DEMO_ACCESS_SECRET = SECRET
await allows('and it works again once the original secret is back', resolveDemoSession(liveCookie, lookup))

/* ── 4. Per-demo authorisation ───────────────────────────────────────────── */

console.log('\nPER-DEMO AUTHORISATION')
line(await sessionAuthorises(liveCookie, 'd-allowed', lookup) === true,
  'the demo this grant names', 'a grant that opens nothing is not a grant')
await refuses('a demo this grant does not name', sessionAuthorises(liveCookie, 'd-other', lookup))
await refuses('a demo that does not exist', sessionAuthorises(liveCookie, 'd-nope', lookup))
await refuses('any demo, with no cookie', sessionAuthorises(undefined, 'd-allowed', lookup))
await refuses('any demo, with a forged cookie', sessionAuthorises('forged.cookie', 'd-allowed', lookup))

/* ── 5. The registry's own rules ─────────────────────────────────────────── */

console.log('\nREGISTRY RULES')
line(registry.grantIsUsable(LIVE) === true, 'a live grant is usable')
line(registry.grantIsUsable(REVOKED) === false, 'a revoked grant is not')
line(registry.grantIsUsable(PAST) === false, 'a grant past its date is not')
line(registry.grantIsUsable(UNDATED) === false, 'a grant with an unparseable date is not')
line(registry.grantIsUsable(LIVE, new Date(Date.now() + 60 * day)) === false,
  'and a live grant stops working on its own date', 'without anyone editing its status')
line(registry.grantAuthorises(LIVE, 'd-allowed') === true, 'a live grant authorises the demo it names')
line(registry.grantAuthorises(LIVE, 'd-other') === false, 'and no other')
line(registry.grantAuthorises(REVOKED, 'd-allowed') === false, 'a revoked grant authorises nothing')
line(registry.DEMOS.length === 0 && registry.GRANTS.length === 0,
  'the shipped registry is empty', 'the room goes to production with nothing in it')

/* ── 6. The shut room ────────────────────────────────────────────────────── */

console.log('\nWITH NO SECRET CONFIGURED — THE STATE THIS RELEASE SHIPS IN')
delete process.env.DEMO_ACCESS_SECRET
line(demoRoomIsClosed() === true, 'the room reports itself shut')
line((await demoToken(LIVE.id)) === null, 'no token can be minted')
line((await signDemoSession(LIVE.id)) === null, 'no session can be signed')
await refuses('the cookie that worked a moment ago', resolveDemoSession(liveCookie, lookup))
await refuses('the token that worked a moment ago', verifyDemoToken(LIVE.id, liveToken, lookup))
await refuses('and no demo can be opened', sessionAuthorises(liveCookie, 'd-allowed', lookup))

/* ── 7. The cookie the browser is given ──────────────────────────────────── */

console.log('\nTHE COOKIE ITSELF')
const header = buildDemoCookie('token-value')
for (const attribute of ['Path=/demo', 'HttpOnly', 'SameSite=Lax', 'Max-Age=']) {
  line(header.includes(attribute), `carries ${attribute}`)
}
line(!header.includes('Domain='), 'is not widened to a domain', 'it belongs to this host and this path')

/* ── Report ──────────────────────────────────────────────────────────────── */

console.log('\n' + '='.repeat(74))
if (failed) {
  console.log(`DEMO ACCESS: ${failed} of ${proved} did not behave as required.`)
  console.log('The room must not be opened until this reads clean.')
  process.exitCode = 1
} else {
  console.log(`DEMO ACCESS: ${proved}/${proved} demonstrated.`)
  console.log('Every way in that was tried was refused, and the one that should open, opened.')
}
