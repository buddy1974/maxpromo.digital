/** Actual production artifact HTTP proof; isolated evidence environment only. Run after build. */
import assert from 'node:assert/strict'
import {evidenceDbProblem} from '../../../../packages/config/evidence.ts'
import {spawn} from 'node:child_process'
import {openSync,closeSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
process.loadEnvFile('apps/web/.env.local')
Object.assign(process.env,{MAXPROMO_EVIDENCE_MODE:'1',EMAIL_PROVIDER:'hostinger',HOSTINGER_WEBHOOK_SECRET:'',WHATSAPP_AUTOMATION:'off'})
const problem=evidenceDbProblem(process.env)
if(problem)throw new Error('Evidence configuration required for built mail proof')
for(const name of ['RESEND_API_KEY','TELEGRAM_BOT_TOKEN','HOSTINGER_MAIL_API_TOKEN'])delete process.env[name]
const log=openSync(join(tmpdir(),'maxpromo-mail-built-runtime.log'),'w')
const server=spawn(process.execPath,['../../node_modules/next/dist/bin/next','start','--port','3041','--hostname','127.0.0.1'],{cwd:'apps/web',env:process.env,stdio:['ignore',log,log],windowsHide:true})
const base='http://127.0.0.1:3041'
let passed=0
try{
 let ready=false
 for(let i=0;i<30;i++){
  try{ready=(await fetch(base+'/api/channels/mail')).status===405}catch{}
  if(ready)break
  await new Promise(resolve=>setTimeout(resolve,500))
 }
 assert.ok(ready,'built receiver route exists')
 for(const method of ['GET','HEAD']){
  const response=await fetch(base+'/api/channels/mail',{method})
  assert.equal(response.status,405);assert.equal(response.headers.get('allow'),'POST')
  if(method==='HEAD')assert.equal(await response.text(),'')
  passed++
 }
 for(const authorization of [null,'Basic abc','Bearer wrong']){
  const response=await fetch(base+'/api/channels/mail',{method:'POST',headers:authorization?{authorization}:{},body:'{malformed'})
  assert.equal(response.status,401);assert.deepEqual(await response.json(),{error:'unauthorized'});passed++
 }
 for(const [path,status] of [['/en',200],['/os/login',200],['/api/os/mail',401],['/api/os/clients',401]]){
  assert.equal((await fetch(base+path,{redirect:'manual'})).status,status);passed++
 }
 const whatsapp=await fetch(base+'/api/channels/whatsapp',{method:'POST',body:'{}'})
 assert.equal(whatsapp.status,503);passed++
 console.log(`BUILT LOCKED RECEIVER: ${passed} HTTP checks passed; no Hostinger configuration, mailbox ingestion or email.`)
}catch{console.error('Built locked receiver HTTP proof failed');process.exitCode=1}
finally{server.kill();closeSync(log)}