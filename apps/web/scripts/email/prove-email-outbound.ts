/**
 * Offline proof for outbound mail and full content (ADR-0023): the identity renderer, the send
 * guards, the transport switches, the provider's bounded text/attachment reads and HTML-to-text.
 * Real modules, fake transports. No database, credentials or network.
 */
import assert from 'node:assert/strict'
import { renderEmail, safeActionUrl } from '../../lib/mail/identity/render.ts'
import { FAMILIES, FAMILY_IDS, PLACEHOLDER } from '../../lib/mail/identity/families.ts'
import { outboundTransport, sendProblems, normalizeRecipients } from '../../lib/mail/outbound.ts'
import { HostingerMailProvider, MAX_TEXT_RESPONSE_BYTES } from '../../lib/mail/provider.ts'
import { htmlToText, bodyFrom, boundedBody } from '../../lib/mail/providerContent.ts'
import { MAX_MAIL_BYTES } from '../../lib/mail/normalization.ts'
import { attachmentReader } from '../../lib/mail/attachments.server.ts'

let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }
async function rejects(name: string, fn: () => Promise<unknown>) { await assert.rejects(fn, name); passed++; console.log(`PASS ${name}`) }

/* ── identity renderer ── */
const hostile = 'Danke.\n\n<script>alert(1)</script> <img src=https://tracker.example/p.gif> "quoted"'
const rel = renderEmail({ family: 'enquiry_response', language: 'de', body: hostile, recipientName: 'Jonas <b>Weber</b>', quoted: { from: 'j@weber.example', at: new Date('2026-10-23T09:00:00Z'), text: 'Original <i>text</i>' } })
check('every value is escaped: no tag from a person or record survives', !rel.html.includes('<script>') && !rel.html.includes('<img') && !rel.html.includes('<b>Weber') && rel.html.includes('&lt;script&gt;') && rel.html.includes('Jonas &lt;b&gt;Weber&lt;/b&gt;'))
check('no images, no remote resources, no scripts in the template at all', !/<img|<script|<link|<iframe|url\(|@import/i.test(rel.html.replace(/&lt;img[^&]*/g, '')))
check('multipart: the text part carries the same words and the signature', rel.text.includes('Danke.') && rel.text.includes('Marcel Tabit Akwe') && rel.text.includes('-- \n') && rel.text.includes('maxpromo.digital'))
check('a reply quotes the original in both parts', rel.text.includes('> Original <i>text</i>') && rel.html.includes('Original &lt;i&gt;text&lt;/i&gt;'))
check('German letter greets and closes in German', rel.text.startsWith('Guten Tag Jonas <b>Weber</b>,') && rel.text.includes('Viele Grüße'))
check('legal line names the business, proprietor and address on every email', rel.text.includes('Maxpromo Digital · Inhaber: Marcel Tabit Akwe · Körnerstr. 8, 45143 Essen'))
check('a relationship email carries no VAT clause', !rel.text.includes('UStG'))
const tx = renderEmail({ family: 'payment_reminder', language: 'en', body: 'thank you.', reference: [['Invoice', 'MP-2026-002'], ['Amount', '156.00 €']], action: { label: 'Pay now', url: 'https://pay.maxpromo.digital/i/abc' } })
check('a commercial email carries the § 19 UStG clause in its language', tx.text.includes('No VAT is charged pursuant to § 19 UStG.') && tx.html.includes('§ 19 UStG'))
check('transactional style: inked wordmark band, reference block, one action', tx.html.includes('MAXPROMO') && tx.html.includes('MP-2026-002') && tx.html.includes('href="https://pay.maxpromo.digital/i/abc"'))
check('English body starts upper-case after the greeting', tx.text.includes('Hello,\n\nThank you.'))
check('actions only to Maxpromo’s own https domains', safeActionUrl('https://pay.maxpromo.digital/x') !== null && safeActionUrl('https://maxpromo.digital/') !== null
  && [ 'http://maxpromo.digital/', 'https://maxpromo.digital.evil.example/', 'https://evil.example/?maxpromo.digital', 'javascript:alert(1)', 'https://user:pw@maxpromo.digital/'].every(u => safeActionUrl(u) === null))
let refused = false
try { renderEmail({ family: 'invoice', language: 'de', body: 'x', action: { label: 'x', url: 'https://evil.example' } }) } catch { refused = true }
check('an unsafe action URL refuses to render', refused)
check('light colour scheme declared so clients do not invert brand colours unpredictably', rel.html.includes('name="color-scheme" content="light"'))
const outsideMso = rel.html.replace(/<!--\[if mso\]>[\s\S]*?<!\[endif\]-->/g, '')
check('600px table layout with inline styles only (a style block exists only inside the Outlook conditional)', rel.html.includes('max-width:600px') && !outsideMso.includes('<style'))
check('Outlook desktop gets a real font instead of falling back to Times', /<!--\[if mso\]><style>[^<]*font-family:Arial/.test(rel.html))
{
  const tx = renderEmail({ family: 'invoice', language: 'de', body: 'Anbei die Rechnung.', reference: [['Rechnung', 'MP-2026-002'], ['Betrag', '156,00 €']] })
  check('a notice carries a hidden preheader with its reference facts; a letter does not', /display:none;max-height:0;overflow:hidden;mso-hide:all[^>]*>Rechnung MP-2026-002 · Betrag 156,00 €<\/div>/.test(tx.html) && !/mso-hide:all/.test(rel.html))
}

/* ── families ── */
check('every family has German and English subject, starter and label', FAMILY_IDS.every(f => FAMILIES[f].label.de && FAMILIES[f].label.en && typeof FAMILIES[f].subject.de === 'function' && typeof FAMILIES[f].starter.en === 'function'))
check('starters state no fact: every gap is a [[marker]]', FAMILY_IDS.every(f => !/\d{1,3}[.,]\d{2} ?€|€ ?\d/.test(FAMILIES[f].starter.de({}) + FAMILIES[f].starter.en({}))))
check('relationship and transactional families are distinct', FAMILIES.reply.style === 'relationship' && FAMILIES.invoice.style === 'transactional')

/* ── send guards ── */
const ok = { to_addrs: ['a@b.example'], cc_addrs: [], bcc_addrs: [], subject: 'Hallo', body: 'Text' }
check('a complete draft has no problems', sendProblems(ok).length === 0)
check('an unfilled [[gap]] blocks sending', sendProblems({ ...ok, body: 'Termin am [[Datum]]' }).some(p => p.includes('[[')) && PLACEHOLDER.test('[[x]]'))
check('no recipient, no subject, no body each block sending', sendProblems({ ...ok, to_addrs: [] }).length > 0 && sendProblems({ ...ok, subject: ' ' }).length > 0 && sendProblems({ ...ok, body: '' }).length > 0)
check('more than 20 recipients are refused', sendProblems({ ...ok, bcc_addrs: Array.from({ length: 20 }, (_, i) => `x${i}@b.example`) }).length > 0)
let badAddress = false
try { normalizeRecipients(['ok@b.example', 'evil@b.example>\r\nBcc: x@y.example']) } catch { badAddress = true }
check('header-injection shaped addresses are refused', badAddress)

/* ── transport switches ── */
check('evidence mode always uses the sink, even with a token', outboundTransport({ MAXPROMO_EVIDENCE_MODE: '1', HOSTINGER_MAIL_API_TOKEN: 't', HOSTINGER_MAILBOX_RESOURCE_ID: 'AC1' })?.mode === 'evidence')
check('the owner kill switch stops every send', outboundTransport({ MAIL_SEND_DISABLED: '1', HOSTINGER_MAIL_API_TOKEN: 't', HOSTINGER_MAILBOX_RESOURCE_ID: 'AC1' }) === null)
check('no token or mailbox means sending is not connected', outboundTransport({}) === null && outboundTransport({ HOSTINGER_MAIL_API_TOKEN: 't' }) === null)
check('attachments: evidence mode and the kill switch disable the reader', attachmentReader({ MAXPROMO_EVIDENCE_MODE: '1', HOSTINGER_MAIL_API_TOKEN: 't', HOSTINGER_MAILBOX_RESOURCE_ID: 'AC1' }) === null && attachmentReader({ MAIL_ATTACHMENTS_DISABLED: '1', HOSTINGER_MAIL_API_TOKEN: 't', HOSTINGER_MAILBOX_RESOURCE_ID: 'AC1' }) === null)
const calls: { url: string; init: RequestInit }[] = []
const live = outboundTransport({ HOSTINGER_MAIL_API_TOKEN: 'tok', HOSTINGER_MAILBOX_RESOURCE_ID: 'AC123' }, (async (url: string, init: RequestInit) => { calls.push({ url, init }); return new Response(null, { status: 204 }) }) as unknown as typeof fetch)!
await live.transport.send({ to: ['a@b.example'], subject: 'S', text: 'T', html: '<p>T</p>', displayName: 'Maxpromo Digital', inReplyTo: { folder: 'INBOX', uid: 7 } })
check('a live send goes only to the fixed Hostinger send endpoint, once, without redirects', calls.length === 1 && calls[0].url === 'https://api.mail.hostinger.com/api/v1/mailboxes/AC123/send' && calls[0].init.redirect === 'error' && calls[0].init.method === 'POST')
check('the send carries text, html, display name and the reply reference', (() => { const b = JSON.parse(String(calls[0].init.body)); return b.text === 'T' && b.html === '<p>T</p>' && b.displayName === 'Maxpromo Digital' && b.inReplyTo.uid === 7 })())
const flaky = outboundTransport({ HOSTINGER_MAIL_API_TOKEN: 'tok', HOSTINGER_MAILBOX_RESOURCE_ID: 'AC123' }, (async () => new Response('x', { status: 502 })) as unknown as typeof fetch)!
await assert.rejects(flaky.transport.send({ to: ['a@b.example'], subject: 'S', text: 'T' }), (e: Error & { outcome?: string }) => e.outcome === 'uncertain'); passed++; console.log('PASS a 5xx after the send left is uncertain, never "failed, nothing sent"')

/* ── provider: bounded reads ── */
const provider = (fn: (url: string) => Response) => new HostingerMailProvider({ token: 't', mailboxResourceId: 'AC1', transport: (async (url: string) => fn(url)) as unknown as typeof fetch, gate: { enabled: true, fixtureVerified: true, isEvidenceMode: () => false } })
const textOk = await provider(() => Response.json({ data: { text: 'Hallo', html: '<p>Hallo</p>' } })).text({ folder: 'INBOX', uid: 3 })
check('message text is read from the fixed host path', textOk.text === 'Hallo')
await rejects('a malformed text response is refused', () => provider(() => Response.json({ data: { text: 5 } })).text({ folder: 'INBOX', uid: 3 }))
await rejects('an oversized text response is refused, not truncated', () => provider(() => new Response('x'.repeat(MAX_TEXT_RESPONSE_BYTES + 10), { headers: { 'content-length': String(MAX_TEXT_RESPONSE_BYTES + 10) } })).text({ folder: 'INBOX', uid: 3 }))
await rejects('a streamed body over the limit is refused even without content-length', () => provider(() => new Response(new ReadableStream({ start(c) { for (let i = 0; i < 20; i++) c.enqueue(new Uint8Array(64 * 1024)); c.close() } }))).text({ folder: 'INBOX', uid: 3 }))
await rejects('unsafe attachment ids never reach the network', () => provider(() => new Response('x')).attachment({ folder: 'INBOX', uid: 3 }, '../../x', 100))
const stream = await provider(() => new Response(new Uint8Array(500))).attachment({ folder: 'INBOX', uid: 3 }, 'YWJj', 100)
await assert.rejects(new Response(stream).arrayBuffer()); passed++; console.log('PASS an attachment stream errors past its byte cap')
await rejects('a declared oversized attachment is refused before streaming', () => provider(() => new Response('x', { headers: { 'content-length': '999999' } })).attachment({ folder: 'INBOX', uid: 3 }, 'YWJj', 100))
await rejects('evidence mode blocks every provider call', () => new HostingerMailProvider({ token: 't', mailboxResourceId: 'AC1', transport: fetch, gate: { enabled: true, fixtureVerified: true, isEvidenceMode: () => true } }).text({ folder: 'INBOX', uid: 1 }))

/* ── webhook attachment → provider attachment (production shapes, 2026-10-24) ── */
const { matchProviderAttachment } = await import('../../lib/mail/attachments.server.ts')
const rest = (filename: string, size: number, id: string, inline = false) => ({ id, filename, sizeBytes: size, inline, contentType: 'application/octet-stream', contentId: null })
const stored = { id: 'f8cf3bb87113d9504e0b18d394e8ec8c2f86fb79830fe3db76870dd3d366dc56:0', filename: 'abbaland.pdf' }
check('the stored attachment is found by name although the provider reports another size and id', matchProviderAttachment(stored, { attachments: [rest('abbaland.pdf', 1548455, 'YXR0YWNobWVudDpJTkJPWDo0MDoy')] })?.id === 'YXR0YWNobWVudDpJTkJPWDo0MDoy')
check('a name normalised at ingestion still matches (Sonderführung → Sonderf__hrung style)', matchProviderAttachment({ id: 'h:0', filename: 'Rechnung_2026_.html' }, { attachments: [rest('Rechnung:2026/.html', 10, 'QQ')] })?.id === 'QQ')
check('without a name match, the position among real attachments decides; inline images do not count', matchProviderAttachment({ id: 'h:1', filename: 'renamed.pdf' }, { attachments: [rest('logo.png', 1, 'IN', true), rest('a.pdf', 1, 'A'), rest('b.pdf', 1, 'B')] })?.id === 'B')
check('two attachments with the same name are ambiguous and nothing is served', matchProviderAttachment({ id: 'h:0', filename: 'scan.pdf' }, { attachments: [rest('scan.pdf', 1, 'A'), rest('scan.pdf', 2, 'B')] }) === null)
check('no match at all serves nothing', matchProviderAttachment({ id: 'h:7', filename: 'x.pdf' }, { attachments: [rest('y.pdf', 1, 'A')] }) === null)

/* ── HTML to text ── */
const converted = htmlToText('<html><head><title>x</title><style>p{color:red}</style></head><body><p>Hallo&nbsp;Marcel,</p><script>steal()</script><p>Preis: 1.200&euro; &amp; mehr</p><ul><li>Eins</li><li>Zwei</li></ul><img src="https://t.example/p.gif"><a href="https://evil.example">Link</a></body></html>')
check('HTML becomes plain text: scripts, styles, images and URLs disappear', !converted.includes('steal') && !converted.includes('color') && !converted.includes('https://') && converted.includes('Hallo Marcel,') && converted.includes('Preis: 1.200€ & mehr') && converted.includes('• Eins'))
check('plain text part wins over HTML when present', bodyFrom({ text: 'Plain', html: '<p>Html</p>' }) === 'Plain' && bodyFrom({ text: '  ', html: '<p>Html</p>' }) === 'Html')
check('an oversized body is cut to what the database accepts and marked', Buffer.byteLength(boundedBody('ä'.repeat(MAX_MAIL_BYTES))) <= MAX_MAIL_BYTES && boundedBody('ä'.repeat(MAX_MAIL_BYTES)).endsWith('[…]'))

/* ── deliverDraft: claim, send once, record ── */
const DRAFT = '20000000-0000-0000-0000-000000000001', THREAD = '30000000-0000-0000-0000-000000000001'
function draftSql(opts: { claim?: boolean; body?: string } = {}) {
  const log: { text: string; values: unknown[] }[] = []
  const draft = { id: DRAFT, account_id: 'hostinger:info@maxpromo.digital', thread_id: THREAD, mode: 'reply', source_message_id: null, to_addrs: ['kunde@example.test'], cc_addrs: [], bcc_addrs: [], subject: 'Re: Anfrage', body: opts.body ?? 'Gern helfen wir.', family: 'reply', language: 'de', entity_kind: null, entity_id: null, follow_up_days: null, status: 'sending', revision: 2 }
  const sql = (async (parts: TemplateStringsArray, ...values: unknown[]) => {
    const text = parts.join('?'); log.push({ text, values })
    if (text.includes("UPDATE mail.drafts SET status='sending'")) return opts.claim === false ? [] : [draft]
    if (text.includes('SELECT quarantine FROM mail.threads')) return [{ quarantine: null }]
    if (text.includes('INSERT INTO mail.messages')) return [{ id: 'msg-out' }]
    return []
  }) as never
  return { sql, log }
}
const transportCalls: unknown[] = []
const okChoice = { mode: 'evidence' as const, transport: { async send(p: unknown) { transportCalls.push(p) } } }
const { deliverDraft } = await import('../../lib/mail/outbound.ts')
const { UncertainOutcome } = await import('../../lib/commercial/types.ts')
const { MailProviderError } = await import('../../lib/mail/provider.ts')
const committed: string[] = []
const req = { draftId: DRAFT, revision: 2, approvalId: '40000000-0000-0000-0000-000000000001', actor: 'os:marcel', today: '2026-10-24', committed: (w: string) => committed.push(w) }

await rejects('a draft that changed after confirmation cannot be claimed, and nothing is sent', () => deliverDraft(draftSql({ claim: false }).sql, req, okChoice))
check('…the transport was never called', transportCalls.length === 0)
const gap = draftSql({ body: 'Termin am [[Datum]]' })
await rejects('an unfilled gap refuses after the claim', () => deliverDraft(gap.sql, req, okChoice))
check('…and the claim is released so Marcel can fix and resend', gap.log.some(l => l.text.includes("SET status='draft'")) && transportCalls.length === 0)
const good = draftSql()
const delivered = await deliverDraft(good.sql, req, okChoice)
check('a confirmed draft is sent once and the external effect is committed', transportCalls.length === 1 && committed.length === 1 && delivered.messageId === 'msg-out')
check('the claim names the confirmed revision', good.log.some(l => l.text.includes("UPDATE mail.drafts SET status='sending'") && l.values.includes(2)))
check('the sent message joins the conversation as outbound, in Sent', good.log.some(l => l.text.includes('INSERT INTO mail.messages') && l.text.includes("'INBOX.Sent','outbound'")))
check('the conversation closes "needs reply", waits for the customer and gets a follow-up date', good.log.some(l => l.text.includes('UPDATE mail.threads SET needs_reply=false') && l.values.includes(true) && l.values.includes('2026-10-27')))
check('the draft is marked sent and the send is audited with its approval', good.log.some(l => l.text.includes("SET status='sent'")) && good.log.some(l => l.text.includes('INSERT INTO mail.action_audit') && l.values.includes(req.approvalId)))
const uncertainLog = draftSql()
let uncertainSends = 0
await assert.rejects(deliverDraft(uncertainLog.sql, req, { mode: 'hostinger', transport: { async send() { uncertainSends++; throw new MailProviderError('uncertain', 504) } } }), (e: unknown) => e instanceof UncertainOutcome)
check('an unconfirmed send is uncertain: recorded, never retried, never reported as sent', uncertainSends === 1 && uncertainLog.log.some(l => l.text.includes("SET status='uncertain'")) && !uncertainLog.log.some(l => l.text.includes('INSERT INTO mail.messages')))
const refusedLog = draftSql()
await rejects('a refused send reports nothing sent', () => deliverDraft(refusedLog.sql, req, { mode: 'hostinger', transport: { async send() { throw new MailProviderError('failed', 422) } } }))
check('…and releases the draft for another attempt', refusedLog.log.some(l => l.text.includes("SET status='draft'")))
await rejects('no transport (not connected or switched off) sends nothing', () => deliverDraft(draftSql().sql, req, null))

console.log(`${passed} outbound and content assertions passed; no network, database or real email.`)
