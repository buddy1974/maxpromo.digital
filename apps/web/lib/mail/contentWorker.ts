import { createHash } from 'node:crypto'
import { MAX_MAIL_BYTES } from './normalization'
import type { ContentLocators } from './hostingerIngestion'

export interface ContentJob {
  id: string; leaseToken:string; subject:string; messageId: string; expiresAt: Date; locators: ContentLocators
  attachments: {id:string;filename:string;size:number}[]
}
export interface ContentJobStore {
  /** Atomic claim; never take completed, expired or leased work. */
  claim(id:string,now:Date):Promise<ContentJob|null>
  /** Commit body/assets and completed status atomically; drop encrypted locators. */
  complete(job:ContentJob,body:string,assets:DurableAsset[]):Promise<void>
  fail(job:ContentJob,state:'expired'|'blocked_policy'|'failed'):Promise<void>
}
export interface DurableAsset {id:string;storageRef:string;sha256:string;size:number;contentType:string}
export interface ContentWorkerPorts {
  store:ContentJobStore
  /** Must enforce verified provider host, pinned DNS, media contract, time/size bounds. */
  retrieveBody:(url:string)=>Promise<string>
  /** Must retrieve safely and durably persist validated bytes before returning a reference. */
  retainAttachment:(url:string,metadata:ContentJob['attachments'][number],key:string)=>Promise<DurableAsset>
  policyVerified:boolean
  clock?:()=>Date
}
/** No live factory is provided until signed-host and body-format constraints are verified. */
export async function processContentJob(id:string,ports:ContentWorkerPorts,now?:Date) {
  if(!ports.policyVerified) return 'blocked_policy' as const
  const clock=ports.clock??(now?()=>now:()=>new Date())
  let job:ContentJob|null=null
  const fail=async(state:'failed'|'expired')=>{
    try { if(job) await ports.store.fail(job,state) } catch { /* Preserve private driver/locator errors. */ }
    return state
  }
  try { job=await ports.store.claim(id,clock()) } catch {
    return fail('failed')
  }
  if(!job) return 'not_claimed' as const
  if(job.expiresAt<=clock()) return fail('expired')
  try {
    if(!job.locators.bodyUrl) throw new Error('missing_body')
    const body=await ports.retrieveBody(job.locators.bodyUrl)
    if(typeof body!=='string' || Buffer.byteLength(body)>MAX_MAIL_BYTES || body.includes('\0')) throw new Error('invalid_body')
    const assets:DurableAsset[]=[]
    for(const attachment of job.attachments){
      if(job.expiresAt<=clock()) return fail('expired')
      const locator=job.locators.attachments.find(a=>a.id===attachment.id)
      if(!locator?.fileUrl) throw new Error('missing_attachment')
      const key=createHash('sha256').update(`${job.messageId}:${attachment.id}`).digest('hex')
      const asset=await ports.retainAttachment(locator.fileUrl,attachment,key)
      if(asset.id!==attachment.id || asset.size!==attachment.size || !/^[a-f0-9]{64}$/.test(asset.sha256) || !asset.storageRef || /^https?:/i.test(asset.storageRef)) throw new Error('invalid_asset')
      assets.push(asset)
    }
    await ports.store.complete(job,body,assets)
    return 'complete' as const
  } catch {
    return fail('failed')
  }
}
