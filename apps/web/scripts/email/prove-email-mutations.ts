/** Deliberately weaken real source in memory; the real safety assertion must fail. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const emit = (source: string) => ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const url = (source: string) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const source = readFileSync('apps/web/lib/mail/provider.ts','utf8')
async function evidenceBlocked(code: string) {
  const providerModule = await import(url(emit(code)))
  let calls=0
  const provider = new providerModule.HostingerMailProvider({token:'synthetic-only',mailboxResourceId:'AC123',gate:{enabled:true,fixtureVerified:true,isEvidenceMode:()=>true},transport:async()=>{calls++;return new Response(null,{status:204})}})
  try { await provider.send({to:['synthetic@example.invalid'],text:'test'}) } catch { /* blocked expected */ }
  assert.equal(calls,0,'Evidence must stop the transport')
}
await evidenceBlocked(source)
const mutated = source.replace(' || gate.isEvidenceMode()', '')
assert.notEqual(source,mutated,'Mutation must change actual source')
await assert.rejects(()=>evidenceBlocked(mutated), /Evidence must stop the transport/)
const providerUrl=url(emit(source))
const routeSource=readFileSync('apps/web/app/api/channels/mail/route.ts','utf8').replace(/^import .*$/gm,'')
const before=process.env.HOSTINGER_MAIL_WEBHOOK_SECRET
process.env.HOSTINGER_MAIL_WEBHOOK_SECRET='synthetic-secret-for-mutation-only-000001'
async function refusesForged(code: string) {
  const route=await import(url(`import {readBoundedPayload,verifyWebhookBearer} from '${providerUrl}'; const NextResponse={json:(body,options={})=>Response.json(body,options)}; const enforceRateLimit=()=>null; const MAX_MAIL_BYTES=262144; ${emit(code)}`))
  const result=await route.POST(new Request('https://local.invalid',{method:'POST',body:'{}'}))
  assert.equal(result.status,401,'Forged webhook must be refused')
}
try {
  await refusesForged(routeSource)
  const broken=routeSource.replace("if (!verifyWebhookBearer(req.headers.get('authorization'), secret))",'if (false)')
  assert.notEqual(broken,routeSource)
  await assert.rejects(()=>refusesForged(broken), /Forged webhook must be refused/)
} finally {
  if(before===undefined) delete process.env.HOSTINGER_MAIL_WEBHOOK_SECRET
  else process.env.HOSTINGER_MAIL_WEBHOOK_SECRET=before
}
console.log('2 real source protection mutations caught: evidence transport gate and webhook authentication.')
