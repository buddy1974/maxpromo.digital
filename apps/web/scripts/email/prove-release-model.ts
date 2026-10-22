/** Opt-in Vercel build proof: production model stays in-cloud; all business data is isolated. */
import {spawn} from 'node:child_process'
import {randomBytes} from 'node:crypto'
import {resolve} from 'node:path'
import {evidenceDbProblem} from '../../../../packages/config/evidence.ts'
import {resolveDatabaseUrl} from '../../../../packages/config/database.ts'

if(process.env.EMAIL_RELEASE_MODEL_PROOF==='1'){
  const target=process.env.EMAIL_RELEASE_EVIDENCE_DB
  const selection=resolveDatabaseUrl()
  const production=selection.ok?selection.url:undefined
  const identity=(value:string)=>{const url=new URL(value);return `${url.hostname.replace(/-pooler\./,'.')}${url.pathname}`}
  if(process.env.VERCEL_ENV!=='production' || !target || !production || identity(target)===identity(production))throw new Error('Release proof isolation unavailable')
  const env:NodeJS.ProcessEnv={...process.env,MAXPROMO_EVIDENCE_MODE:'1',EVIDENCE_DATABASE_URL:target,
    NEON_DATABASE_URL:'',DATABASE_URL:'',OS_AGENT_SECRET:randomBytes(32).toString('hex'),
    OS_AGENT_ALLOWED_ACTORS:'telegram:100000001',EMAIL_PROVIDER:'disabled',WHATSAPP_AUTOMATION:'off',
    HOSTINGER_WEBHOOK_SECRET:'',AGENT_PROOF_BASE:'http://127.0.0.1:3040'}
  for(const name of ['RESEND_API_KEY','TELEGRAM_BOT_TOKEN','HOSTINGER_MAIL_API_TOKEN'])delete env[name]
  if(evidenceDbProblem(env))throw new Error('Release proof evidence target rejected')
  const root=resolve(process.cwd(),'../..')
  const next=resolve(root,'node_modules/next/dist/bin/next')
  const server=spawn(process.execPath,[next,'start','--port','3040','--hostname','127.0.0.1'],{env,stdio:'ignore'})
  try{
    let ready=false
    for(let attempt=0;attempt<60;attempt++){
      try{ready=(await fetch(`${env.AGENT_PROOF_BASE}/api/health`,{signal:AbortSignal.timeout(3000)})).ok}catch{}
      if(ready)break
      if(server.exitCode!==null)throw new Error('Evidence server stopped')
      await new Promise(resolve=>setTimeout(resolve,500))
    }
    if(!ready)throw new Error('Evidence server unavailable')
    const status=await new Promise<number|null>((finish,reject)=>{
      const proof=spawn(process.execPath,[resolve(root,'packages/tooling/prove-commercial-agent.mjs')],{cwd:root,env,stdio:'inherit'})
      const timeout=setTimeout(()=>{proof.kill();reject(new Error('Release proof timed out'))},360000)
      proof.on('error',error=>{clearTimeout(timeout);reject(error)})
      proof.on('exit',status=>{clearTimeout(timeout);finish(status)})
    })
    if(status!==0)throw new Error('Production-model commercial proof failed')
    console.log('RELEASE MODEL PROOF: passed using in-cloud production model; isolated data and simulated mail only')
  }finally{server.kill()}
}
