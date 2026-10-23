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
const diagnosticsUrl=url(emit(readFileSync('apps/web/lib/mail/hostingerDiagnostics.ts','utf8')))
const routeSource=readFileSync('apps/web/app/api/channels/mail/route.ts','utf8').replace(/^import .*$/gm,'')
const before=process.env.HOSTINGER_WEBHOOK_SECRET
process.env.HOSTINGER_WEBHOOK_SECRET='synthetic-secret-for-mutation-only-000001'
async function refusesForged(code: string) {
  const route=await import(url(`import {readBoundedPayload,verifyWebhookBearer} from '${providerUrl}'; import {describeHostingerStructure} from '${diagnosticsUrl}'; const NextResponse={json:(body,options={})=>Response.json(body,options)}; const enforceRateLimit=()=>null; const MAX_MAIL_BYTES=262144; const HOSTINGER_MAILBOX="info@maxpromo.digital";const parseHostingerWebhook=()=>{throw new Error("invalid")};const acceptHostingerMail=async()=>{};const hostingerReceiptReady=async()=>true;const getDb=()=>{}; const console={warn:()=>{}}; ${emit(code)}`))
  const result=await route.POST(new Request('https://local.invalid',{method:'POST',body:'{}'}))
  assert.equal(result.status,401,'Forged webhook must be refused')
}
try {
  await refusesForged(routeSource)
  const broken=routeSource.replace("if (!verifyWebhookBearer(req.headers.get('authorization'), secret))",'if (false)')
  assert.notEqual(broken,routeSource)
  await assert.rejects(()=>refusesForged(broken), /Forged webhook must be refused/)
} finally {
  if(before===undefined) delete process.env.HOSTINGER_WEBHOOK_SECRET
  else process.env.HOSTINGER_WEBHOOK_SECRET=before
}
const parserSource=readFileSync('apps/web/lib/mail/hostingerWebhook.ts','utf8')
const normalizationUrl=url(emit(readFileSync('apps/web/lib/mail/normalization.ts','utf8')))
const contentUrl=url(emit(readFileSync('apps/web/lib/mail/content.ts','utf8').replace("from './normalization'",`from '${normalizationUrl}'`)))
async function refusesWrongMailbox(code: string) {
  const parser=await import(url(emit(code.replace("from './normalization'",`from '${normalizationUrl}'`).replace("from './content'",`from '${contentUrl}'`))))
  const event={id:'82470320-5364-57eb-8c8e-8004ec3c9573',event:'message.received',timestamp:'2026-04-03T12:00:00Z',data:{eventId:'opaque-123',mailboxAddress:'attacker@example.com',messageId:'<a@b.com>',inReplyTo:'',references:[],subject:'test',from:'a@b.com',to:['attacker@example.com'],cc:[],date:'invalid',plainBody:'',htmlBody:'',bodyUrl:'',attachments:[]}}
  assert.throws(()=>parser.parseHostingerWebhook(event,'info@maxpromo.digital'),/wrong_mailbox/,'Wrong mailbox must be refused')
}
await refusesWrongMailbox(parserSource)
const wrongMailbox=parserSource.replace("if (mailbox !== address(configuredMailbox))",'if (false)')
assert.notEqual(wrongMailbox,parserSource)
await assert.rejects(()=>refusesWrongMailbox(wrongMailbox),/Wrong mailbox must be refused/)
console.log('3 real source protection mutations caught: evidence transport gate, webhook authentication and mailbox binding.')


async function hidesStructuralValues(code: string) {
  const diagnostic=await import(url(emit(code)))
  const output=JSON.stringify(diagnostic.describeHostingerStructure({data:{eventId:'',subject:'PRIVATE_MUTATION_SENTINEL'}},'info@maxpromo.digital'))
  assert(!output.includes('PRIVATE_MUTATION_SENTINEL'),'Structural diagnostics must hide values')
}
const diagnosticSource=readFileSync('apps/web/lib/mail/hostingerDiagnostics.ts','utf8')
await hidesStructuralValues(diagnosticSource)
const leaking=diagnosticSource.replace('firstAttachment:knownShape(attachments[0],ATTACHMENT)}','firstAttachment:knownShape(attachments[0],ATTACHMENT),raw:value}')
assert.notEqual(leaking,diagnosticSource)
await assert.rejects(()=>hidesStructuralValues(leaking),/Structural diagnostics must hide values/)
console.log('1 structural-log privacy mutation caught; raw values cannot reach diagnostics.')

// A provider event without mailbox identity must never reach durable acceptance.
async function neverIngestsUnidentified(code: string) {
  let accepted=0
  const route=await import(url(`import {readBoundedPayload,verifyWebhookBearer} from '${providerUrl}'; const describeHostingerStructure=()=>({}); const NextResponse={json:(body,options={})=>Response.json(body,options)}; const enforceRateLimit=()=>null; const MAX_MAIL_BYTES=262144; const HOSTINGER_MAILBOX="info@maxpromo.digital";const parseHostingerWebhook=()=>({eventId:'',deliveryId:'d',degraded:[]});globalThis.__accepted=()=>{};const acceptHostingerMail=async()=>{globalThis.__accepted();return {created:true}};const hostingerReceiptReady=async()=>true;const getDb=()=>()=>[]; const console={warn:()=>{},info:()=>{}}; ${emit(code)}`))
  ;(globalThis as Record<string,unknown>).__accepted=()=>{accepted++}
  const previous={secret:process.env.HOSTINGER_WEBHOOK_SECRET,provider:process.env.EMAIL_PROVIDER,session:process.env.OS_SESSION_SECRET}
  process.env.HOSTINGER_WEBHOOK_SECRET='synthetic-secret-for-mutation-only-000001';process.env.EMAIL_PROVIDER='hostinger';process.env.OS_SESSION_SECRET='synthetic-locator-key-000000000000000000001'
  try {
    const result=await route.POST(new Request('https://local.invalid',{method:'POST',headers:{authorization:'Bearer synthetic-secret-for-mutation-only-000001'},body:'{}'}))
    assert.equal(accepted,0,"Unidentified events must never be ingested");assert.equal(result.status,200)
  } finally {
    for(const [name,value] of [['HOSTINGER_WEBHOOK_SECRET',previous.secret],['EMAIL_PROVIDER',previous.provider],['OS_SESSION_SECRET',previous.session]] as const){if(value===undefined)delete process.env[name];else process.env[name]=value}
  }
}
await neverIngestsUnidentified(routeSource)
const ingestsUnidentified=routeSource.replace('if(!event.eventId) {','if(false) {')
assert.notEqual(ingestsUnidentified,routeSource)
await assert.rejects(()=>neverIngestsUnidentified(ingestsUnidentified),/Unidentified events must never be ingested/)
console.log('1 no-identity mutation caught; acknowledged Test traffic cannot create mail.')

// An unparseable sender must never be linked into another thread by header hints.
async function isolatesUnknownSender(code: string) {
  const parser=await import(url(emit(code.replace("from './normalization'",`from '${normalizationUrl}'`).replace("from './content'",`from '${contentUrl}'`))))
  const event=parser.parseHostingerWebhook({id:'d-1',event:'message.received',timestamp:'2026-04-03T12:00:00Z',data:{eventId:'opaque-1',mailboxAddress:'info@maxpromo.digital',messageId:'<n@x.com>',inReplyTo:'<p@x.com>',references:['<p@x.com>'],subject:'s',from:'A <a@x.com>, B <b@x.com>',to:[],cc:[],date:'',plainBody:'',htmlBody:'',bodyUrl:'',attachments:[]}},'info@maxpromo.digital')
  assert.deepEqual([event.inReplyTo,event.references],['',[]],'Unknown sender must not thread')
}
await isolatesUnknownSender(parserSource)
const threadsUnknown=parserSource.replace("if (!parsedSender) { references = []; inReplyTo = '' }",'')
assert.notEqual(threadsUnknown,parserSource)
await assert.rejects(()=>isolatesUnknownSender(threadsUnknown),/Unknown sender must not thread/)
console.log('1 unknown-sender threading mutation caught; ambiguous From cannot join a thread.')
