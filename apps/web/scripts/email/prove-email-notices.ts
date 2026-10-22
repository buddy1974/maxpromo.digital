/** Real owner briefing/notice capabilities, deterministic record ports. No proactive send or network. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const emit = (source: string) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const validator = `data:text/javascript;base64,${Buffer.from(emit(readFileSync('apps/web/lib/commercial/validate.ts','utf8'))).toString('base64')}`
const source = emit(readFileSync('apps/web/lib/commercial/capabilities/views.ts','utf8')).replace(/^import[\s\S]*?from ['"][^'"]+['"];\r?\n/gm, '')
const ports = `import {v} from '${validator}';
const q=async p=>await p, addDays=x=>x, OPEN_STAGES=[],statusesFor=()=>[],loadInvoicesForMoney=async()=>[],
receivables=()=>({outstanding:{},overdue:{},overdueInvoices:[],drafts:[],reconcile:[]}), formatPerCurrency=()=> '0',daysBetween=()=>1;
`
const views = await import(`data:text/javascript;base64,${Buffer.from(ports + source).toString('base64')}`)
let queried = ''
const important = { id: 'email-test', subject: 'Urgent service incident', classification: 'system', needs_reply: true, updated_at: new Date('2026-10-22T08:00:00Z') }
let records = [important]
const sql = async (parts: TemplateStringsArray) => {
  const text = parts.join('?')
  if (text.includes('FROM mail.threads')) { queried = text; return records }
  return []
}
const ctx = { sql, actor: 'telegram:100000001', channel: 'telegram', today: '2026-10-22', now: new Date('2026-10-22T08:00:00Z') }
let passed = 0
function check(name: string, fn: () => void) { fn(); passed++; console.log(`PASS ${name}`) }
const notice = await views.ownerNotices.run(ctx, {})
check('important system email produces compact owner notice', () => {
  assert.equal(notice.data.notices.length, 1)
  assert.match(notice.data.notices[0].text, /external content[\s\S]*Urgent service incident/)
})
check('SQL suppresses spam/newsletters/routine but includes system alerts', () => {
  assert.match(queried, /NOT IN \('newsletter','spam','routine'\)/)
  assert(!queried.includes("'routine','system'"))
})
const repeated = await views.ownerNotices.run(ctx, {})
check('repeated polls produce identical durable notice keys', () => assert.equal(notice.data.notices[0].key, repeated.data.notices[0].key))
const brief = await views.ownerBrief.run(ctx, {})
check('morning brief surfaces actionable mail and untrusted label', () => {
  assert(brief.lines.includes('EMAIL'))
  assert(brief.lines.some((line: string) => /Urgent service incident.*reply needed/.test(line)))
  assert(brief.lines.some((line: string) => /untrusted/.test(line)))
})
records = [{ ...important, needs_reply: false }]
const waiting = await views.ownerNotices.run(ctx, {})
check('waiting-only email does not create immediate notification', () => assert.equal(waiting.data.notices.length, 0))
const waitingBrief = await views.ownerBrief.run(ctx, {})
check('waiting mail remains visible in morning brief', () => assert(waitingBrief.lines.some((line: string) => /waiting for response/.test(line))))
const missingSql = async (parts: TemplateStringsArray) => { if (parts.join('').includes('FROM mail.threads')) throw Object.assign(new Error('schema absent'), { code: '3F000' }); return [] }
const absent = await views.ownerNotices.run({ ...ctx, sql: missingSql }, {})
check('absent optional mail migration does not break notices', () => assert.equal(absent.data.notices.length, 0))
await assert.rejects(views.ownerNotices.run({ ...ctx, sql: async () => { throw Object.assign(new Error('database unavailable'), { code: '08006' }) } }, {}), /database unavailable/)
check('operational DB failure is not silently presented as empty mailbox', () => assert(true))
console.log(`${passed} email notice/brief checks passed; no network.`)
