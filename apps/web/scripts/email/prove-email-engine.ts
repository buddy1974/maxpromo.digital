/** Actual approval engine; in-memory atomic claim SQL and recording email transport. Offline only. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import ts from 'typescript'
const state = { effects: 0, caps: new Map<string, unknown>() }
Object.assign(globalThis, { __mailEngineProof: state })
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
Object.assign(globalThis, { __mailEngineHash: hash })
const emitted = ts.transpileModule(readFileSync('apps/web/lib/commercial/engine.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace(/^import[\s\S]*?from ['"][^'"]+['"];\r?\n/gm, '')
const ports = `const CAPABILITIES=globalThis.__mailEngineProof.caps;
const writeAudit=async()=>{};
const stableStringify=JSON.stringify;
const sha256Hex=globalThis.__mailEngineHash;
const payloadHash=(id,payload)=>sha256Hex(id+JSON.stringify(payload));
const berlinDate=()=> '2026-10-22';
class CapabilityRefusal extends Error{}; class UncertainOutcome extends Error{};class InputError extends Error{};
const isPrepared=p=>'payload' in p && 'preview' in p;
`
const engine = await import(`data:text/javascript;base64,${Buffer.from(ports + emitted).toString('base64')}`)
interface Approval { id: string; capability: string; payload: Record<string, unknown>; payload_hash: string; status: string; expires_at: string; result: unknown }
let row: Approval
const sql = async (parts: TemplateStringsArray, ...values: unknown[]) => {
  const text = parts.join('?')
  if (text.includes("SET status = 'executing'")) {
    if (row.id === values[1] && row.status === 'pending' && row.payload_hash === values[2] && new Date(row.expires_at).getTime() > Date.now()) { row.status = 'executing'; return [{ ...row }] }
    return []
  }
  if (text.includes('SELECT id, capability, payload')) return [{ ...row }]
  if (text.includes("SET status = 'expired'")) { row.status = 'expired'; return [] }
  if (text.includes('UPDATE os_approvals SET status = ?')) { row.status = values[0] as string; row.result = JSON.parse(values[1] as string); return [] }
  return []
}
let count = 0
function check(label: string, test: () => void) { test(); count++; console.log(`PASS ${label}`) }
for (const capability of ['email.send','email.trash']) {
  state.caps.set(capability, { risk: 'AMBER', execute: async () => { state.effects++; await Promise.resolve(); return { summary: 'Simulated only' } } })
  const req = { approvalId: '10000000-0000-0000-0000-000000000001', payloadHash: 'a'.repeat(64), actor: 'telegram:100000001', channel: 'telegram' }
  const fresh = () => ({ id: req.approvalId, capability, payload: { to: 'nobody@example.test' }, payload_hash: req.payloadHash, status: 'pending', expires_at: new Date(Date.now() + 60000).toISOString(), result: null })
  row = fresh()
  const before = state.effects
  const responses = await Promise.all([engine.executeApproval(sql, req), engine.executeApproval(sql, req)])
  check(`${capability} concurrent confirmation executes once`, () => { assert.equal(state.effects, before + 1); assert(responses.some(r => r.status === 'done')) })
  const replay = await engine.executeApproval(sql, req)
  check(`${capability} replay returns recorded result without effect`, () => { assert.equal(replay.status, 'done'); assert.equal(state.effects, before + 1) })
  row = { ...fresh(), expires_at: '2000-01-01T00:00:00Z' }
  const expired = await engine.executeApproval(sql, req)
  check(`${capability} expired approval denied`, () => { assert.equal(expired.code, 'expired'); assert.equal(state.effects, before + 1) })
  row = fresh()
  const modified = await engine.executeApproval(sql, { ...req, payloadHash: 'b'.repeat(64) })
  check(`${capability} wrong payload hash denied`, () => { assert.equal(modified.code, 'payload_changed'); assert.equal(state.effects, before + 1) })
  row = { ...fresh(), status: 'superseded' }
  const superseded = await engine.executeApproval(sql, req)
  check(`${capability} superseded approval denied`, () => { assert.equal(superseded.code, 'superseded'); assert.equal(state.effects, before + 1) })
}
console.log(`${count} actual email approval engine checks passed; fake transport only.`)
