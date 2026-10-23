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
const connectivityUrl=url(emit(readFileSync('apps/web/lib/mail/hostingerConnectivity.ts','utf8')))
const routeSource=readFileSync('apps/web/app/api/channels/mail/route.ts','utf8').replace(/^import .*$/gm,'')
const before=process.env.HOSTINGER_WEBHOOK_SECRET
process.env.HOSTINGER_WEBHOOK_SECRET='synthetic-secret-for-mutation-only-000001'
async function refusesForged(code: string) {
  const route=await import(url(`import {readBoundedPayload,verifyWebhookBearer} from '${providerUrl}'; import {isHostingerConnectivityTest} from '${connectivityUrl}'; const NextResponse={json:(body,options={})=>Response.json(body,options)}; const enforceRateLimit=()=>null; const MAX_MAIL_BYTES=262144; const HOSTINGER_MAILBOX="info@maxpromo.digital";const parseHostingerWebhook=()=>{throw new Error("invalid")};const acceptHostingerMail=async()=>{};const getDb=()=>{}; const console={warn:()=>{}}; ${emit(code)}`))
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

async function refusesChangedTest(code: string) {
  const detector=await import(url(emit(code)))
  const changed=structuredClone(detector.HOSTINGER_CONNECTIVITY_SAMPLE);changed.data.plainBody='malicious replacement'
  assert.equal(detector.isHostingerConnectivityTest(changed),false,'Changed connectivity fixture must be refused')
}
const connectivitySource=readFileSync('apps/web/lib/mail/hostingerConnectivity.ts','utf8')
await refusesChangedTest(connectivitySource)
const permissive=connectivitySource.replace('return exact(value,HOSTINGER_CONNECTIVITY_SAMPLE)','return true')
assert.notEqual(permissive,connectivitySource)
await assert.rejects(()=>refusesChangedTest(permissive),/Changed connectivity fixture must be refused/)
console.log('1 exact-connectivity protection mutation caught; modified sample cannot bypass validation.')
