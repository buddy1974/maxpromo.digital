import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import type { Sql } from '@/lib/commercial/types'
import { classifyMail } from './normalization'
import type { VerifiedHostingerEvent } from './hostingerWebhook'

export const HOSTINGER_MAILBOX = 'info@maxpromo.digital'
export const HOSTINGER_ACCOUNT = `hostinger:${HOSTINGER_MAILBOX}`
interface SealedLocator { version: 1; nonce: string; tag: string; ciphertext: string }
export interface ContentLocators { bodyUrl: string | null; attachments: { id: string; fileUrl: string }[] }
function key(secret: string) {
  if (secret.length < 32) throw new Error('mail_locator_key_unavailable')
  return Buffer.from(hkdfSync('sha256',secret,'maxpromo-os','mail-signed-locators-v1',32))
}
export function sealLocators(value: ContentLocators, secret: string, binding: string): SealedLocator {
  const nonce=randomBytes(12)
  const cipher=createCipheriv('aes-256-gcm',key(secret),nonce)
  cipher.setAAD(Buffer.from(binding))
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()])
  return { version:1,nonce:nonce.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:encrypted.toString('base64') }
}
export function openLocators(value: SealedLocator, secret: string, binding: string): ContentLocators {
  try {
    if(value.version!==1) throw new Error('version')
    const decipher=createDecipheriv('aes-256-gcm',key(secret),Buffer.from(value.nonce,'base64'))
    decipher.setAAD(Buffer.from(binding)); decipher.setAuthTag(Buffer.from(value.tag,'base64'))
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.ciphertext,'base64')),decipher.final()]).toString('utf8')) as ContentLocators
  } catch { throw new Error('mail_locator_unavailable') }
}

/** Atomic acceptance only; no URL fetch, model, lead creation or external action. */
export async function acceptHostingerMail(sql: Sql, event: VerifiedHostingerEvent, encryptionSecret: string, now = new Date()) {
  const classification=classifyMail({subject:event.subject,text:event.previewText})
  const sealed=sealLocators({bodyUrl:event.bodyUrl,attachments:event.attachments.map(a=>({id:a.id,fileUrl:a.fileUrl}))},encryptionSecret,`${HOSTINGER_ACCOUNT}:${event.eventId}`)
  const safe={deliveryId:event.deliveryId,eventId:event.eventId,mailbox:event.mailbox,messageId:event.messageId,
    inReplyTo:event.inReplyTo,references:event.references,subject:event.subject,sender:event.sender,
    recipients:event.recipients,cc:event.cc,eventAt:event.eventAt,emailDate:event.emailDate,previewText:event.previewText,
    attachments:event.attachments.map(a=>({id:a.id,filename:a.filename,size:a.size,contentType:a.contentType})),
    classification:classification.classification,needsReply:classification.needsReply}
  // Provider TTL starts no later than receipt. Never extend an expired locator on retry.
  const expires=new Date(Math.min(Date.parse(event.eventAt),now.getTime())+24*60*60*1000)
  const rows=await sql`SELECT * FROM mail.accept_hostinger(${HOSTINGER_ACCOUNT},${JSON.stringify(safe)}::jsonb,${JSON.stringify(sealed)}::jsonb,${expires.toISOString()}::timestamptz)`
  if(!rows[0]) throw new Error('mail_acceptance_unavailable')
  return {created:rows[0].created===true}
}
