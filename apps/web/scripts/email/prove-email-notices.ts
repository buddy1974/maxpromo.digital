/** Real owner briefing/notice capabilities, deterministic record ports. No proactive send or network. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const emit = (source: string) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const validator = `data:text/javascript;base64,${Buffer.from(emit(readFileSync('apps/web/lib/commercial/validate.ts','utf8'))).toString('base64')}`
const source = emit(readFileSync('apps/web/lib/commercial/capabilities/views.ts','utf8')).replace(/^import[\s\S]*?from ['"][^'"]+['"];\r?\n/gm, '')
const ports = `import {v} from '${validator}';
const q=async p=>await p, addDays=x=>x, OPEN_STAGES=[],statusesFor=()=>[],loadInvoicesForMoney=async()=>[],
receivables=()=>({outstanding:{},overdue:{},overdueInvoices:[],drafts:[],reconcile:[]}), formatPerCurrency=()=> '0',daysBetween=()=>1,
openAgentEvents=async()=>[], focus=(kind,id,label)=>({kind,id,label}), leadLabel=l=>l.company??l.name??'', eur=(a,c)=>a+' '+c,
isoDate=x=>x?new Date(x).toISOString().slice(0,10):null, addTo=(acc,c,a)=>{acc[c]=(acc[c]??0)+a;return acc}, leadStage=()=>null, STAGE_WEIGHT={};
`
const views = await import(`data:text/javascript;base64,${Buffer.from(ports + source).toString('base64')}`)
let queried = ''
const important = { id: 'email-test', subject: 'Urgent service incident', classification: 'system', needs_reply: true, updated_at: new Date('2026-10-22T08:00:00Z') }
let records = [important]
const sql = async (parts: TemplateStringsArray) => {
  const text = parts.join('?')
  // Briefing aggregates (ADR-0023) answer by query shape; every list query sees the records.
  if (text.includes('count(*)::int AS n, min(t.updated_at)')) return [{ n: records.filter(r => r.needs_reply).length, oldest: records[0]?.updated_at ?? null }]
  if (text.includes('count(*)::int AS n FROM mail.threads')) return [{ n: 0 }]
  if (text.includes("direction='outbound' AND received_at > now()")) return [{ n: 0 }]
  if (text.includes('CROSS JOIN LATERAL')) { queried = text; return [] }
  if (text.includes('FROM mail.threads')) { queried = text; return records.map(r => ({ ...r, sender: 'customer@example.test' })) }
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
check('quarantined mail (provider Junk, phishing, owner spam, blocked) is excluded from attention, brief and notices', () => {
  assert.match(queried, /quarantine IS NULL/)
})
check('SQL suppresses spam/newsletters/routine but includes system alerts', () => {
  assert.match(queried, /NOT IN \('newsletter','spam','routine'\)/)
  assert(!queried.includes("'routine','system'"))
})
const repeated = await views.ownerNotices.run(ctx, {})
check('repeated polls produce identical durable notice keys', () => assert.equal(notice.data.notices[0].key, repeated.data.notices[0].key))
const brief = await views.ownerBrief.run(ctx, {})
check('morning brief states the replies owed and labels new mail as external content', () => {
  assert(brief.lines.includes('COMMUNICATION'))
  assert(brief.lines.some((line: string) => /1 conversation\(s\) waiting for your reply/.test(line)))
  assert(brief.lines.includes('SINCE YESTERDAY'))
  assert(brief.lines.some((line: string) => /new email conversation\(s\).*external content/.test(line)))
})
check('the brief carries the structured snapshot the /os screen renders (one model)', () => assert(Array.isArray(brief.data.overnight) && Array.isArray(brief.data.communications)))
records = [{ ...important, needs_reply: false }]
const waiting = await views.ownerNotices.run(ctx, {})
check('waiting-only email does not create immediate notification', () => assert.equal(waiting.data.notices.length, 0))
const waitingBrief = await views.ownerBrief.run(ctx, {})
check('a conversation waiting for the customer raises no reply line in the brief', () => assert(!waitingBrief.lines.some((line: string) => /waiting for your reply/.test(line))))
const missingSql = async (parts: TemplateStringsArray) => { if (parts.join('').includes('FROM mail.threads')) throw Object.assign(new Error('schema absent'), { code: '3F000' }); return [] }
const absent = await views.ownerNotices.run({ ...ctx, sql: missingSql }, {})
check('absent optional mail migration does not break notices', () => assert.equal(absent.data.notices.length, 0))
await assert.rejects(views.ownerNotices.run({ ...ctx, sql: async () => { throw Object.assign(new Error('database unavailable'), { code: '08006' }) } }, {}), /database unavailable/)
check('operational DB failure is not silently presented as empty mailbox', () => assert(true))
// Mutation: without the quarantine predicate the real attention SQL would surface provider spam.
const mutated = emit(readFileSync('apps/web/lib/commercial/capabilities/views.ts','utf8').replace('AND quarantine IS NULL AND ', 'AND ')).replace(/^import[\s\S]*?from ['"][^'"]+['"];\r?\n/gm, '')
assert.notEqual(mutated, source, 'Mutation must change the actual attention query')
const weakened = await import(`data:text/javascript;base64,${Buffer.from(ports + mutated).toString('base64')}`)
records = [important]; await weakened.ownerNotices.run(ctx, {})
check('mutation removing the quarantine predicate is detected', () => assert.doesNotMatch(queried, /quarantine IS NULL/))
console.log(`${passed} email notice/brief checks passed; no network.`)
