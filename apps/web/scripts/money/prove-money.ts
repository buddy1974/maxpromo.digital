/**
 * Offline proof for the Money rail (ADR-0025): webhook signatures, rail gates, the Stripe client's
 * outcome classification, event shape checks, and the document emails (identity, PDF, § 19, no VAT,
 * pay link). Real modules, fake transports. No database, credentials or network.
 */
import assert from 'node:assert/strict'
import { parseSignatureHeader, signStripePayload, verifyStripeSignature, webhookSecrets } from '../../lib/money/stripe/signature.ts'
import { formEncode, railStatus, stripeRail, StripeRailError, toMinor, fromMinor } from '../../lib/money/stripe/client.ts'
import { parseStripeEvent } from '../../lib/money/stripe/events.ts'
import { reversalStatusFromStripe } from '../../lib/money/ledger.ts'
import { isPayToken, payUrl, PAY_ORIGIN } from '../../lib/money/links.ts'
import { invoiceMail, angebotMail, reminderMail, invoiceAsks } from '../../lib/documents/mail.ts'
import { SECRETISH } from '../../lib/commercial/audit.ts'

let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }
async function rejects(name: string, fn: () => Promise<unknown>, test?: (e: unknown) => boolean) { await assert.rejects(fn, (e: unknown) => (test ? test(e) : true)); passed++; console.log(`PASS ${name}`) }

/* ── webhook signatures ── */
const secret = 'whsec_' + 'A'.repeat(32)
const other = 'whsec_' + 'B'.repeat(32)
const body = JSON.stringify({ id: 'evt_1234567890', object: 'event' })
const now = 1_790_000_000
const header = signStripePayload(body, secret, now)
check('a correctly signed event verifies', verifyStripeSignature(body, header, [secret], now).ok)
check('a rotated secret list still verifies (old + new)', verifyStripeSignature(body, header, [other, secret], now).ok)
check('the wrong secret is refused', !verifyStripeSignature(body, header, [other], now).ok)
check('one changed byte in the body is refused', !verifyStripeSignature(body.replace('123', '124'), header, [secret], now).ok)
check('a replay older than 5 minutes is refused', (verifyStripeSignature(body, header, [secret], now + 301) as { problem?: string }).problem === 'stale_timestamp')
check('a timestamp from the future is refused', (verifyStripeSignature(body, header, [secret], now - 301) as { problem?: string }).problem === 'stale_timestamp')
check('a missing header is refused', (verifyStripeSignature(body, null, [secret], now) as { problem?: string }).problem === 'missing_header')
check('a malformed header is refused', (verifyStripeSignature(body, 't=abc,v1=zz', [secret], now) as { problem?: string }).problem === 'malformed_header')
check('no configured secret refuses everything (fails closed)', (verifyStripeSignature(body, header, [], now) as { problem?: string }).problem === 'no_secret')
check('a v0 or other scheme does not count as a signature', parseSignatureHeader(`t=${now},v0=${'a'.repeat(64)}`) === null)
check('several v1 signatures: any matching one verifies', verifyStripeSignature(body, `t=${now},v1=${'0'.repeat(64)},${header.split(',')[1]}`, [secret], now).ok)
check('secrets of the wrong shape are ignored, never used', webhookSecrets(`sk_live_x, ${secret} ,whsec_short`).length === 1)

/* ── rail gates ── */
const key = (mode: string) => `sk_${mode}_${'a1B2'.repeat(6)}`
check('no key: not connected', railStatus({}).connected === false && railStatus({}).reason === 'no_key' && stripeRail({}) === null)
check('a key of the wrong shape: not connected', railStatus({ STRIPE_SECRET_KEY: 'pk_test_123' }).reason === 'bad_key')
check('a test key connects in test mode', railStatus({ STRIPE_SECRET_KEY: key('test') }).mode === 'test' && railStatus({ STRIPE_SECRET_KEY: key('test') }).connected)
check('a LIVE key does nothing until Marcel sets STRIPE_LIVE=1', railStatus({ STRIPE_SECRET_KEY: key('live') }).reason === 'live_not_enabled' && stripeRail({ STRIPE_SECRET_KEY: key('live') }) === null)
check('with STRIPE_LIVE=1 the live key connects', railStatus({ STRIPE_SECRET_KEY: key('live'), STRIPE_LIVE: '1' }).mode === 'live')
check('the evidence environment refuses live keys even with STRIPE_LIVE=1', railStatus({ STRIPE_SECRET_KEY: key('live'), STRIPE_LIVE: '1', MAXPROMO_EVIDENCE_MODE: '1' }).reason === 'evidence_live_key')
check('the owner kill switch disconnects the rail', railStatus({ STRIPE_SECRET_KEY: key('test'), STRIPE_PAYMENTS_DISABLED: '1' }).reason === 'disabled')
check('restricted keys (rk_) are accepted', railStatus({ STRIPE_SECRET_KEY: `rk_test_${'x9'.repeat(10)}` }).connected)
check('rail status never contains the key', !JSON.stringify(railStatus({ STRIPE_SECRET_KEY: key('test') })).includes('a1B2'))
check('audit redaction recognises Stripe secret shapes', [key('live'), key('test'), `rk_live_${'q'.repeat(20)}`, secret].every(s => { SECRETISH.lastIndex = 0; return SECRETISH.test(s) }))

/* ── client ── */
check('form encoding uses bracket notation for nested data', formEncode({ a: 1, line_items: [{ price_data: { currency: 'eur' } }], metadata: { invoice_id: 'x y' } })
  === 'a=1&line_items%5B0%5D%5Bprice_data%5D%5Bcurrency%5D=eur&metadata%5Binvoice_id%5D=x%20y')
check('minor units are exact for cents', toMinor(156) === 15600 && toMinor(0.1 + 0.2) === 30 && fromMinor(15599) === 155.99)
const calls: { url: string; init: RequestInit }[] = []
const rail = (respond: (url: string) => Response | Promise<Response>) => stripeRail({ STRIPE_SECRET_KEY: key('test') }, (async (url: string, init: RequestInit) => { calls.push({ url, init }); return respond(url) }) as unknown as typeof fetch)!
const session = { amountMinor: 15600, currency: 'EUR' as const, productName: 'Rechnung MP-1', invoiceId: '11111111-1111-1111-1111-111111111111', invoiceNumber: 'MP-1', sessionRowId: '22222222-2222-2222-2222-222222222222', locale: 'de' as const, successUrl: 'https://maxpromo.digital/de/pay/t?paid=1', cancelUrl: 'https://maxpromo.digital/de/pay/t', expiresAt: now + 3600 }
const created = await rail(() => Response.json({ id: 'cs_test_abc123', url: 'https://checkout.stripe.com/c/pay/cs_test_abc123', status: 'open', expires_at: now + 3600, payment_intent: null, livemode: false })).createCheckoutSession(session, 'mp-checkout:row')
const sent = calls.at(-1)!
check('a checkout is created at the fixed Stripe endpoint with the idempotency key and pinned version', sent.url === 'https://api.stripe.com/v1/checkout/sessions' && (sent.init.headers as Record<string, string>)['Idempotency-Key'] === 'mp-checkout:row' && (sent.init.headers as Record<string, string>)['Stripe-Version'] === '2024-06-20' && sent.init.redirect === 'error')
check('the checkout names the invoice and session row in metadata, in session and payment intent', String(sent.init.body).includes('metadata%5Binvoice_id%5D=11111111') && String(sent.init.body).includes('payment_intent_data%5Bmetadata%5D%5Bsession_row%5D=22222222'))
check('the amount is the minor-unit open balance in the invoice currency; no tax, no Stripe invoice', String(sent.init.body).includes('unit_amount%5D=15600') && String(sent.init.body).includes('currency%5D=eur') && !/tax|invoice_creation/.test(String(sent.init.body)))
check('the created session is read back', created.id === 'cs_test_abc123' && created.livemode === false)
await rejects('a 5xx on create is uncertain (it may exist): same key next time', () => rail(() => new Response('{}', { status: 502 })).createCheckoutSession(session, 'k'), e => e instanceof StripeRailError && e.outcome === 'uncertain')
await rejects('a network failure on create is uncertain', () => rail(() => { throw new TypeError('network') }).createCheckoutSession(session, 'k'), e => e instanceof StripeRailError && e.outcome === 'uncertain')
await rejects('a 4xx is failed with the provider code only', () => rail(() => Response.json({ error: { code: 'parameter_invalid_integer', message: 'secret detail' } }, { status: 400 })).createCheckoutSession(session, 'k'),
  e => e instanceof StripeRailError && e.outcome === 'failed' && e.code === 'parameter_invalid_integer' && !e.message.includes('secret detail'))
await rejects('a read that fails is failed, never uncertain', () => rail(() => new Response('x', { status: 500 })).retrieveBalanceTransaction('txn_123456'), e => e instanceof StripeRailError && e.outcome === 'failed')
await rejects('ids of the wrong shape never reach the network', () => rail(() => Response.json({})).retrieveBalanceTransaction('../../v1/charges'))
await rejects('amounts below 0.50 are refused before calling Stripe', () => rail(() => Response.json({})).createCheckoutSession({ ...session, amountMinor: 49 }, 'k'))
check('no request ever carried the key in a URL or body', calls.every(c => !c.url.includes('a1B2') && !String(c.init.body ?? '').includes('a1B2')))

/* ── events ── */
const evt = (o: Record<string, unknown>) => ({ id: 'evt_1A2b3C4d5E', object: 'event', type: 'charge.succeeded', livemode: false, created: now, data: { object: { id: 'ch_123', ...o } } })
check('a well-formed event parses', parseStripeEvent(evt({}))?.type === 'charge.succeeded')
check('anything that is not an event is refused', [null, [], {}, { ...evt({}), object: 'charge' }, { ...evt({}), id: 'x' }, { ...evt({}), livemode: 'no' }, { ...evt({}), type: 'X; DROP' }, { ...evt({}), data: {} }].every(v => parseStripeEvent(v) === null))
check('refund statuses map onto reversal states', reversalStatusFromStripe('succeeded') === 'succeeded' && reversalStatusFromStripe('requires_action') === 'pending' && reversalStatusFromStripe('canceled') === 'cancelled' && reversalStatusFromStripe('failed') === 'failed')

/* ── pay links ── */
check('pay links live on the canonical maxpromo.digital origin under the document language', payUrl('A'.repeat(32), 'en') === `${PAY_ORIGIN}/en/pay/${'A'.repeat(32)}` && /^https:\/\/(www\.)?maxpromo\.digital$/.test(PAY_ORIGIN))
check('only tokens of the stored shape are accepted', isPayToken('a'.repeat(32)) && !isPayToken('short') && !isPayToken('a'.repeat(31) + '/') && !isPayToken('../' + 'a'.repeat(40)))

/* ── document emails ── */
const inv = { invoice_number: 'MP-2026-002', client_name: 'Jonas Weber — Weber GmbH', address: 'Weg 1\n45127 Essen', date: '2026-05-01', due_date: '2026-05-15',
  line_items: [{ description: 'Website', qty: 1, unit_price: 156, total: 156 }], subtotal: 156, total: 156, currency: 'EUR' as const, language: 'de' as const }
const m1 = await invoiceMail(inv, { payUrl: 'https://maxpromo.digital/de/pay/' + 'x'.repeat(32) })
check('invoice email: German subject from the labels, invoice family', m1.subject === 'Rechnung Nr. MP-2026-002 — Maxpromo Digital' && m1.family === 'invoice')
check('invoice email: the invoice itself is attached as a PDF', m1.attachments.length === 1 && m1.attachments[0].contentType === 'application/pdf' && m1.attachments[0].filename.endsWith('.pdf') && Buffer.from(m1.attachments[0].content, 'base64').subarray(0, 5).toString() === '%PDF-')
check('invoice email: amount, due date, IBAN and reference from the record', m1.text.includes('156,00') && m1.text.includes('15.05.2026') && m1.text.includes('IBAN: DE03') && m1.text.includes('Verwendungszweck: MP-2026-002'))
check('invoice email: § 19 UStG clause, never a VAT amount', m1.text.includes('§ 19 UStG') && !/MwSt\.?\s*\d|Umsatzsteuer\s*\d|VAT\s*\d|\d+\s*%\s*(MwSt|USt)/i.test(m1.text))
check('invoice email: pay link as the one action, only when given', m1.html.includes('href="https://maxpromo.digital/de/pay/') && m1.text.includes('online per Karte'))
const m2 = await invoiceMail(inv)
check('invoice email without card payment carries no pay link and no card sentence', !m2.html.includes('/pay/') && !m2.text.includes('Karte'))
check('version binds the email: same record → same version; any change → new version', (await invoiceMail(inv)).version === m2.version && (await invoiceMail({ ...inv, total: 157, subtotal: 157 })).version !== m2.version && m1.version !== m2.version)
check('greeting uses the person, not the company', m1.text.startsWith('Guten Tag Jonas Weber,'))
const dep = await invoiceMail({ ...inv, anzahlung: 50, restbetrag: 106 })
check('a deposit is acknowledged and the remaining balance asked', dep.text.includes('106,00') && dep.text.includes('Anzahlung von 50,00') && invoiceAsks({ total: 156, anzahlung: 50, restbetrag: 106 }) === 106)
const en = await invoiceMail({ ...inv, language: 'en', client_name: 'Weber GmbH' }, { open: 100 })
check('English invoice: English copy, open amount after part payment, clause in English', en.subject.startsWith('Invoice') && /Amount due: 100,00[\s ]€/.test(en.text) && en.text.includes('No VAT is charged pursuant to § 19 UStG.'))
const hostile = await invoiceMail({ ...inv, client_name: '<script>alert(1)</script>', invoice_number: 'MP-<b>9' })
check('record values are escaped in the HTML', !hostile.html.includes('<script>alert') && !hostile.html.includes('<b>9'))
const q = await angebotMail({ id: 'a', angebot_number: 'MP-A-2026-003', client_name: 'Jonas Weber', client_email: null, client_address: null, line_items: [{ description: 'Website', qty: 1, total: 900 }],
  subtotal: 900, total: 900, status: 'draft', created_at: '2026-10-20', valid_until: '2026-11-19', notes: null, anzahlung: null, anzahlung_date: null, anzahlung_method: null,
  payment_terms: '50 % bei Auftrag', included_items: null, currency: 'EUR', language: 'de' })
check('quote email: proposal family, PDF attached, validity and total from the record, § 19', q.family === 'proposal' && q.attachments[0].filename.includes('MP-A-2026-003') && q.text.includes('19.11.2026') && q.text.includes('900,00') && q.text.includes('§ 19 UStG'))
const r = await reminderMail(inv, 156, {})
check('reminder: polite, states only number, open amount and due date, invoice attached again', r.subject.startsWith('Zahlungserinnerung') && r.text.includes('156,00') && r.text.includes('15.05.2026') && r.attachments.length === 1 && r.family === 'payment_reminder')
check('no document email contains an image or remote resource', [m1, m2, q, r].every(m => !/<img|<link|url\(|<script/i.test(m.html)))

console.log(`${passed} money assertions passed; no network, database or real payment.`)
