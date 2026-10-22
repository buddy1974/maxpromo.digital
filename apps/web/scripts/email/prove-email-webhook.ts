/** Real route logic with only framework/rate-limit stubs. No server, DB or network. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const emit = (source: string) => ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const url = (source: string) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const provider = url(emit(readFileSync('apps/web/lib/mail/provider.ts','utf8')))
const source = readFileSync('apps/web/app/api/channels/mail/route.ts','utf8').replace(/^import .*$/gm,'')
const route = await import(url(`import {readBoundedPayload,verifyWebhookBearer} from '${provider}';
const NextResponse = { json:(body,options={}) => Response.json(body,options) };
const enforceRateLimit=()=>null; const MAX_MAIL_BYTES=262144;
${emit(source)}`))
const before = process.env.HOSTINGER_MAIL_WEBHOOK_SECRET
let count=0
try {
  delete process.env.HOSTINGER_MAIL_WEBHOOK_SECRET
  assert.equal((await route.POST(new Request('https://local.test',{method:'POST',body:'{}'}))).status,503); count++
  process.env.HOSTINGER_MAIL_WEBHOOK_SECRET='local-test-secret-'.repeat(3)
  assert.equal((await route.POST(new Request('https://local.test',{method:'POST',body:'{}'}))).status,401); count++
  const headers={authorization:`Bearer ${process.env.HOSTINGER_MAIL_WEBHOOK_SECRET}`}
  assert.equal((await route.POST(new Request('https://local.test',{method:'POST',headers,body:'{}'}))).status,503); count++
  assert.equal((await route.POST(new Request('https://local.test',{method:'POST',headers,body:'x'.repeat(262145)}))).status,413); count++
  assert(!source.includes('JSON.parse')); count++
  console.log(`${count} email webhook checks passed; unverified contract fails closed.`)
} finally {
  if(before===undefined) delete process.env.HOSTINGER_MAIL_WEBHOOK_SECRET
  else process.env.HOSTINGER_MAIL_WEBHOOK_SECRET=before
}
