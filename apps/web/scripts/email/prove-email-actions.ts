/** Real route with auth/DB/engine ports stubbed. No network or production DB. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const state = { owner: 'marcel', calls: [] as Record<string, unknown>[], approved: true }
Object.assign(globalThis, { __mailRouteProof: state })
const source = readFileSync('apps/web/app/api/os/mail/actions/route.ts', 'utf8').replace(/^import .*$/gm, '')
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
await assert.rejects(runtime.executeMailAction({ accountId: 'proof', threadId: '10000000-0000-0000-0000-000000000001', action: 'trash' }, fakeSql), /Owner confirmation required/)
count++; console.log('PASS real mutation runtime rejects unconfirmed trash')
const trashed = await runtime.executeMailAction({ accountId: 'proof', threadId: '10000000-0000-0000-0000-000000000001', action: 'trash', approvalId: 'proof-approval' }, fakeSql)
assert.match(trashed.summary, /nothing was deleted/); assert(audit.some(values => values.includes('proof-approval')))
count++; console.log('PASS confirmed trash is local to the OS, audited with its approval, and deletes nothing')
console.log(`${count} email action route checks passed; no network or real mail.`)
