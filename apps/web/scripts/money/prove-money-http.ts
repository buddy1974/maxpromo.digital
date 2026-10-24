/**
 * The Money routes over real HTTP against a locally running web app in evidence mode (ADR-0025):
 * the Stripe webhook door and the pay page / checkout door. Throwaway signing secret only — the
 * server and this proof share it through STRIPE_WEBHOOK_SECRET; it is never a Stripe secret.
 *
 *   # terminal 1: evidence runtime with STRIPE_WEBHOOK_SECRET=whsec_<random> on :3020 (no STRIPE_SECRET_KEY)
 *   # terminal 2: STRIPE_WEBHOOK_SECRET=<same> node --env-file=apps/web/.env.local … prove-money-http.ts
 */
import assert from 'node:assert/strict'
import { evidenceDbProblem, EVIDENCE_DOC_PREFIX } from '../../../../packages/config/evidence.ts'
import { getDb } from '../../lib/db.ts'
import { signStripePayload } from '../../lib/money/stripe/signature.ts'
import { ensurePaymentLink } from '../../lib/money/links.ts'

const problem = evidenceDbProblem(process.env)
const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
if (problem || !secret.startsWith('whsec_')) { console.error('refusing to run —', problem ?? 'STRIPE_WEBHOOK_SECRET (throwaway) not set'); process.exit(1) }
const BASE = process.env.PROOF_BASE_URL ?? 'http://localhost:3020'
const sql = getDb()
let passed = 0
function check(name: string, ok: boolean, detail = '') { assert.ok(ok, `${name} ${detail}`); passed++; console.log(`PASS ${name}`) }
const now = () => Math.floor(Date.now() / 1000)
const tag = Date.now().toString(36)
const post = (body: string, signature: string | null) => fetch(`${BASE}/api/channels/stripe`, { method: 'POST', headers: { 'content-type': 'application/json', ...(signature ? { 'stripe-signature': signature } : {}) }, body })
const eventBody = JSON.stringify({ id: `evt_http${tag}`, object: 'event', type: 'checkout.session.completed', livemode: false, created: now(),
  data: { object: { id: `cs_test_http${tag}`, payment_status: 'paid', payment_intent: `pi_http${tag}`, amount_total: 1000, currency: 'eur', metadata: {} } } })
let invoiceId = ''
try {
  check('GET on the webhook is 405', (await fetch(`${BASE}/api/channels/stripe`)).status === 405)
  check('an unsigned event is refused (401)', (await post(eventBody, null)).status === 401)
  check('a wrongly signed event is refused (401)', (await post(eventBody, signStripePayload(eventBody, 'whsec_' + 'W'.repeat(32), now()))).status === 401)
  check('a replayed old signature is refused (401)', (await post(eventBody, signStripePayload(eventBody, secret, now() - 600))).status === 401)
  check('a body changed after signing is refused (401)', (await post(eventBody.replace('1000', '9000'), signStripePayload(eventBody, secret, now()))).status === 401)
  const ok = await post(eventBody, signStripePayload(eventBody, secret, now()))
  check('a correctly signed event is accepted (200) without detail', ok.status === 200 && JSON.stringify(await ok.json()) === '{"received":true}')
  const row = (await sql`SELECT outcome, detail FROM money.provider_events WHERE event_id = ${`evt_http${tag}`}` as { outcome: string; detail: Record<string, unknown> }[])[0]
  check('…recorded once, and a session the OS never created is "reconcile", not a payment', row?.outcome === 'reconcile')
  const dup = await post(eventBody, signStripePayload(eventBody, secret, now()))
  check('the same event delivered again is 200 and changes nothing', dup.status === 200 && (await sql`SELECT count(*)::int AS n FROM money.provider_events WHERE event_id = ${`evt_http${tag}`}` as { n: number }[])[0].n === 1)
  const junk = '{"object":"charge"}'
  check('a signed body that is not an event is refused (400)', (await post(junk, signStripePayload(junk, secret, now()))).status === 400)

  // Pay page and checkout door, with no Stripe key on the server.
  invoiceId = (await sql`INSERT INTO os_invoices (invoice_number, client_name, line_items, subtotal, total, restbetrag, status, due_date, currency, language)
    VALUES (${`${EVIDENCE_DOC_PREFIX}HT${tag}`}, 'HTTP Proof — Proof GmbH', '[]'::jsonb, 42, 42, 42, 'sent', current_date + 7, 'EUR', 'de') RETURNING id` as { id: string }[])[0].id
  const link = await ensurePaymentLink(sql, invoiceId, 'proof')
  const page = await fetch(`${BASE}/de/pay/${link.token}`)
  const html = await page.text()
  check('the pay page answers 200 with the invoice number, the open amount and the bank details', page.status === 200 && html.includes(`HT${tag}`) && html.includes('42,00') && html.includes('IBAN'))
  check('it is private: noindex and no referrer', /noindex/.test(html) && /no-referrer/.test(html))
  check('it does not show the client’s name', !html.includes('HTTP Proof'))
  check('without a Stripe key it offers no card button', !html.includes('action="/api/pay/checkout"'))
  const unknownPage = await fetch(`${BASE}/de/pay/${'Q'.repeat(32)}`)
  check('an unknown token shows a neutral page', unknownPage.status === 200 && !(await unknownPage.text()).includes('IBAN'))
  const form = (token: string) => fetch(`${BASE}/api/pay/checkout`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `token=${encodeURIComponent(token)}&lang=de` })
  check('the checkout door refuses a malformed token (400)', (await form('../../x')).status === 400)
  const nc = await form(link.token)
  check('with no key the checkout door sends the payer back with "not connected" (303) and creates nothing',
    nc.status === 303 && (nc.headers.get('location') ?? '').endsWith(`/de/pay/${link.token}?e=not_connected`)
    && (await sql`SELECT count(*)::int AS n FROM money.checkout_sessions WHERE invoice_id = ${invoiceId}::uuid` as { n: number }[])[0].n === 0)
  check('GET on the checkout door is 405 (a link scanner cannot start a payment)', (await fetch(`${BASE}/api/pay/checkout`)).status === 405)
  check('the Money API refuses anonymous callers', (await fetch(`${BASE}/api/os/money`, { redirect: 'manual' })).status === 401)
  check('the Money actions refuse anonymous callers', (await fetch(`${BASE}/api/os/money/actions`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/json' }, body: '{}' })).status === 401)
  check('the attachment upload refuses anonymous callers', (await fetch(`${BASE}/api/os/mail/attachments`, { method: 'POST', redirect: 'manual' })).status === 401)
} finally {
  await sql`DELETE FROM money.provider_events WHERE event_id = ${`evt_http${tag}`}`
  if (invoiceId) {
    await sql`DELETE FROM money.checkout_sessions WHERE invoice_id = ${invoiceId}::uuid`
    await sql`DELETE FROM money.payment_links WHERE invoice_id = ${invoiceId}::uuid`
    await sql`DELETE FROM os_invoices WHERE id = ${invoiceId}::uuid`
  }
}
console.log(`${passed} HTTP assertions passed against ${BASE}; no Stripe key, no real payment.`)
