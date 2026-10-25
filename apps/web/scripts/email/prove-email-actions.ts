/** Real route with auth/DB/engine ports stubbed. No network or production DB. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const state = { owner: 'marcel', calls: [] as Record<string, unknown>[], approved: true }
Object.assign(globalThis, { __mailRouteProof: state })
// The route delegates to the shared owner-action guard; both are loaded for real, ports stubbed.
const strip = (file: string) => readFileSync(file, 'utf8').replace(/^import [\s\S]*?from .*$/gm, '').replace(/^import .*$/gm, '')
const source = [strip('apps/web/lib/owner-request.ts'), strip('apps/web/lib/commercial/ownerActions.ts'), strip('apps/web/app/api/os/mail/actions/route.ts')].join('\n')
const ports = `const state=globalThis.__mailRouteProof;
const NextResponse={json:(body,options={})=>new Response(JSON.stringify(body),{status:options.status??200,headers:options.headers})};
const withAuth=fn=>req=>state.owner ? fn(req,{session:{sub:state.owner}}) : NextResponse.json({error:'Unauthorized'},{status:401});
const getDb=()=>async()=>state.approved?[{capability:'email.send'}]:[];
const runCapability=async(sql,req)=>{state.calls.push(req);return {status:'done',result:{summary:'local only'}}};
const executeApproval=async(sql,req)=>{state.calls.push(req);return {status:'refused',message:'Provider disabled'}};
const rejectApproval=executeApproval;
`
const emitted = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const route = await import(`data:text/javascript;base64,${Buffer.from(ports + emitted).toString('base64')}`)
const payload = { action: 'run', requestId: 'email-proof-001', capability: 'email.state', input: { thread_id: '10000000-0000-0000-0000-000000000001', action: 'mark_read' } }
const req = (body: unknown = payload, headers: Record<string, string> = {}) => new Request('https://maxpromo.digital/api/os/mail/actions', { method: 'POST', headers: { origin: 'https://maxpromo.digital', 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })
let count = 0
async function expect(name: string, request: Request, status: number) { assert.equal((await route.POST(request)).status, status, name); count++; console.log(`PASS ${name}`) }
await expect('same origin owner can update local state', req(), 200)
assert.equal(state.calls[0].actor, 'os:marcel'); count++
await expect('cannot spoof actor', req({ ...payload, actor: 'telegram:attacker' }), 400)
state.owner = ''
await expect('unauthenticated request blocked', req(), 401)
state.owner = 'staff'
await expect('non owner session blocked', req(), 403)
state.owner = 'marcel'
await expect('forged origin blocked', req(payload, { origin: 'https://attacker.test' }), 403)
await expect('missing origin blocked', new Request('https://maxpromo.digital/api/os/mail/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }), 403)
await expect('cross site metadata blocked', req(payload, { 'sec-fetch-site': 'cross-site' }), 403)
await expect('wrong content type blocked', req(payload, { 'content-type': 'text/plain' }), 415)
// Limit is 64 KiB: a full draft (20,000 characters plus recipients) fits, anything larger does not.
await expect('declared oversized payload blocked', req(payload, { 'content-length': '70000' }), 413)
await expect('actual oversized streamed payload blocked', req('x'.repeat(70000)), 413)
await expect('malformed JSON rejected', req('{bad'), 400)
await expect('array payload rejected', req([]), 400)
await expect('non email capability blocked', req({ ...payload, capability: 'outreach.send' }), 400)
state.approved = false
await expect('approval from another actor blocked', req({ action: 'execute', approvalId: '10000000-0000-0000-0000-000000000001', payloadHash: 'a'.repeat(64) }), 404)
const runtimeSource = readFileSync('apps/web/lib/mail/runtime.ts','utf8').replace(/^import .*$/gm, '')
const runtimeCode = ts.transpileModule(runtimeSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const runtime = await import(`data:text/javascript;base64,${Buffer.from('class CapabilityRefusal extends Error {}; const getDb=()=>{throw new Error("No real database")};\n' + runtimeCode).toString('base64')}`)
const audit: unknown[][] = []
const fakeSql = async (parts: TemplateStringsArray, ...values: unknown[]) => { if (parts.join('').includes('INSERT INTO mail.action_audit')) audit.push(values); return [{ id: 'proof-message' }] }
await runtime.executeMailAction({ accountId: 'proof', threadId: '10000000-0000-0000-0000-000000000001', action: 'mark_read', actor: 'os:marcel' }, fakeSql)
assert(audit.some(values => values.some(value => typeof value === 'string' && value.includes('"actor":"os:marcel"')))); count++; console.log('PASS local state records owner actor in durable audit')
await assert.rejects(runtime.executeMailAction({ accountId: 'proof', threadId: '10000000-0000-0000-0000-000000000001', action: 'send' }, fakeSql), /Sending requires a confirmed draft/)
count++; console.log('PASS real mutation runtime has no send path (sending is the confirmed-draft path only)')
/* Trash is reversible and local (0025): no approval, state kept, a scheduled email parked as a draft. */
const statements: string[] = []
const recordingSql = async (parts: TemplateStringsArray, ...values: unknown[]) => { statements.push(parts.join('?')); return fakeSql(parts, ...values) }
const trashed = await runtime.executeMailAction({ accountId: 'proof', threadId: '10000000-0000-0000-0000-000000000001', action: 'trash', actor: 'os:marcel' }, recordingSql)
assert.match(trashed.summary, /nothing was deleted/)
assert(statements.some(q => /SET trashed=true,trashed_at=/.test(q)) && !statements.some(q => /needs_reply=false|waiting=false/.test(q.split('SET trashed=true')[1] ?? '')))
count++; console.log('PASS trash is local, keeps the reply / waiting state for an exact restore, and deletes nothing')
assert(statements.some(q => /UPDATE mail\.drafts SET status='draft'[\s\S]*status='scheduled'/.test(q)) && statements.some(q => /UPDATE os_approvals SET status='superseded'/.test(q)))
count++; console.log('PASS trashing a conversation turns its scheduled email back into a draft and cancels the waiting confirmation')
statements.length = 0
const restored = await runtime.executeMailAction({ accountId: 'proof', threadId: '10000000-0000-0000-0000-000000000001', action: 'restore', actor: 'os:marcel' }, recordingSql)
assert.match(restored.summary, /Restored/); assert(statements.some(q => /SET trashed=false,trashed_at=NULL/.test(q)))
count++; console.log('PASS restore returns the conversation from Trash')
assert(!/DELETE\s+FROM/i.test(runtimeSource))
count++; console.log('PASS the mail runtime has no delete statement (permanent deletion is not offered)')
console.log(`${count} email action route checks passed; no network or real mail.`)
