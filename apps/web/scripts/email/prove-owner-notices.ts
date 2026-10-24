/**
 * Offline proof for the Owner Control Plane dispatcher (ADR-0024): what reaches Marcel's phone,
 * exactly once, at most five per run, and nothing on failure that would block a retry.
 */
import assert from 'node:assert/strict'
import { dispatchOwnerNotices, format, pushable, MAX_PER_RUN, type Notice } from '../../lib/owner/notices.ts'

let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }

const T = '10000000-0000-0000-0000-000000000001'
check('a customer reply is pushed', pushable({ key: `email-replied:${T}:2026-10-24T08:00:00.000Z`, severity: 'warning', text: 'x' }))
check('an ordinary email needing a reply is not pushed (Telegram is not an inbox)', !pushable({ key: `email:${T}:x`, severity: 'warning', text: 'x' }))
check('a critical system email is pushed', pushable({ key: `email:${T}:x`, severity: 'critical', text: 'x' }))
check('new enquiries are not pushed twice (intake already pushed them)', !pushable({ key: 'lead-new:abc', severity: 'warning', text: 'x' }))
check('follow-ups and renewals stay in /os and the brief', !pushable({ key: 'followup:a:2026-10-24', severity: 'info', text: 'x' }) && !pushable({ key: 'renewal:a', severity: 'info', text: 'x' }))
check('the morning brief, approvals, agent failures and overdue invoices are pushed', ['brief:2026-10-24', 'approval:a', 'agent:a', 'overdue:a:2026-w43'].every(key => pushable({ key, severity: key.startsWith('brief') ? 'info' : 'warning', text: 'x' })))
check('an info-level agent completion is not pushed', !pushable({ key: 'agent:done', severity: 'info', text: 'x' }))
const formatted = format({ key: `email-replied:${T}:t`, severity: 'warning', text: 'Weber <script>x</script> replied to “Angebot”', action: `Open email thread ${T}` })
check('message text is escaped for Telegram HTML', formatted.includes('&lt;script&gt;') && !formatted.includes('<script>'))
check('a reply notice links to the exact conversation in the OS', formatted.includes(`https://maxpromo.digital/os/inbox?thread=${T}`))
check('an approval notice links to Approvals', format({ key: 'approval:a', severity: 'warning', text: 'Approval needed: x' }).includes('/os/approvals'))

/* Ledger: a fake table that behaves like the primary key. */
const ledger = new Map<string, string>()
const sql = (async (parts: TemplateStringsArray, ...values: unknown[]) => {
  const text = parts.join('?')
  if (text.includes('INSERT INTO os_owner_notices')) { const key = String(values[0]); if (ledger.has(key)) return []; ledger.set(key, 'claimed'); return [{ notice_key: key }] }
  if (text.includes("SET outcome='delivered'")) { ledger.set(String(values[0]), 'delivered'); return [] }
  if (text.includes('DELETE FROM os_owner_notices')) { if (ledger.get(String(values[0])) === 'claimed') ledger.delete(String(values[0])); return [] }
  return []
}) as never
const sent: string[] = []
const ok = async (text: string) => { sent.push(text); return { sent: true } }
const notices: Notice[] = [
  { key: `email-replied:${T}:1`, severity: 'warning', text: 'reply', action: `Open email thread ${T}` },
  { key: `email:${T}:1`, severity: 'warning', text: 'ordinary' },
  { key: 'brief:2026-10-24', severity: 'info', text: 'brief' },
]
const first = await dispatchOwnerNotices(sql, { notices: async () => notices, send: ok })
check('the first run sends each pushable notice once', first.sent === 2 && sent.length === 2 && first.skipped === 1)
const second = await dispatchOwnerNotices(sql, { notices: async () => notices, send: ok })
check('a repeated run of the same situation sends nothing (stable keys, delivery ledger)', second.sent === 0 && sent.length === 2)
const many: Notice[] = Array.from({ length: 9 }, (_, i) => ({ key: `approval:${i}`, severity: 'warning', text: `a${i}` }))
const capped = await dispatchOwnerNotices(sql, { notices: async () => many, send: ok })
check(`at most ${MAX_PER_RUN} messages per run; the rest wait`, capped.sent === MAX_PER_RUN)
check('the most severe notices go first', (await (async () => { const order: string[] = []; await dispatchOwnerNotices(sql, { notices: async () => [{ key: 'agent:w', severity: 'warning', text: 'w' }, { key: 'uncertain:c', severity: 'critical', text: 'c' }], send: async t => { order.push(t); return { sent: true } } }); return order[0].includes('urgent') })()))
const failing = await dispatchOwnerNotices(sql, { notices: async () => [{ key: 'overdue:x:w', severity: 'warning', text: 'overdue' }], send: async () => ({ sent: false }) })
check('a failed send releases its claim so the next trigger retries it', failing.failed === 1 && !ledger.has('overdue:x:w'))
const retried = await dispatchOwnerNotices(sql, { notices: async () => [{ key: 'overdue:x:w', severity: 'warning', text: 'overdue' }], send: ok })
check('the retry then delivers it once', retried.sent === 1 && ledger.get('overdue:x:w') === 'delivered')

delete process.env.OWNER_TELEGRAM_NOTICES
const before = ledger.size
const inactive = await dispatchOwnerNotices(sql, { notices: async () => [{ key: 'approval:inactive', severity: 'warning', text: 'x' }] })
check('until the owner activates notices, nothing is claimed and nothing is sent', inactive.sent === 0 && ledger.size === before && !ledger.has('approval:inactive'))

console.log(`${passed} owner notice assertions passed; nothing sent to Telegram.`)
