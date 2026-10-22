import type { Sql } from '@/lib/commercial/types'
import { HOSTINGER_ACCOUNT, openLocators } from './hostingerIngestion'
import type { ContentJobStore, DurableAsset } from './contentWorker'
import { classifyMail } from './normalization'

/** No scheduler/live transport is armed here. Verified worker ports must be supplied explicitly. */
export function createMailContentStore(sql:Sql,secret:string):ContentJobStore {
  return {
    async claim(id,now){
      const rows=await sql`UPDATE mail.content_jobs SET state='processing',lease_until=now()+interval '15 minutes',lease_token=gen_random_uuid(),attempts=attempts+1
        WHERE id=${id}::uuid AND (state IN ('blocked_policy','failed') OR (state='processing' AND lease_until<now())) AND expires_at>${now.toISOString()}::timestamptz
        AND EXISTS(SELECT 1 FROM mail.messages m WHERE m.id=mail.content_jobs.message_id AND m.account_id=${HOSTINGER_ACCOUNT})
        AND attempts<3 RETURNING id,message_id,expires_at,sealed_locator,lease_token`
      if(!rows[0]) return null
      const row=rows[0]
      const messages=await sql`SELECT account_id,provider_message_id,attachments,subject FROM mail.messages WHERE id=${row.message_id}::uuid`
      if(!messages[0] || messages[0].account_id!==HOSTINGER_ACCOUNT) throw new Error('mail_content_account_unavailable')
      return {id:String(row.id),leaseToken:String(row.lease_token),subject:String(messages[0].subject),messageId:String(row.message_id),expiresAt:new Date(String(row.expires_at)),
        locators:openLocators(row.sealed_locator as Parameters<typeof openLocators>[0],secret,`${HOSTINGER_ACCOUNT}:${messages[0].provider_message_id}`),
        attachments:messages[0].attachments as {id:string;filename:string;size:number}[]}
    },
    async complete(job,body,assets:DurableAsset[]){
      const triage=classifyMail({subject:job.subject,text:body})
      const rows=await sql`SELECT mail.complete_content(${job.id}::uuid,${job.leaseToken}::uuid,${body},${JSON.stringify(assets)}::jsonb,${triage.classification},${triage.needsReply}) AS completed`
      if(!rows[0]?.completed) throw new Error('mail_content_lease_expired')
    },
    async fail(job,state){
      await sql`UPDATE mail.content_jobs SET state=${state},lease_until=NULL,
        sealed_locator=CASE WHEN expires_at<=now() OR ${state}='expired' THEN '{}'::jsonb ELSE sealed_locator END
        WHERE id=${job.id}::uuid AND lease_token=${job.leaseToken}::uuid AND state='processing'`
    },
  }
}

export async function expireMailLocators(sql:Sql) {
  await sql`UPDATE mail.content_jobs SET sealed_locator='{}',state=CASE WHEN state='complete' THEN state ELSE 'expired' END,lease_until=NULL
    WHERE expires_at<=now() AND sealed_locator<>'{}'::jsonb`
}
