import { isIP } from 'node:net'

type Shape = Record<string,unknown>
const object = (value: unknown): value is Shape => !!value && typeof value==='object' && !Array.isArray(value)
const type = (value: unknown): string => value===undefined?'absent':value===null?'null':Array.isArray(value)?'array':typeof value
function field(value: unknown): Shape {
  if(typeof value==='string')return {type:'string',length:value.length}
  if(Array.isArray(value))return {type:'array',length:value.length,elementTypes:[...new Set(value.map(type))].sort()}
  return {type:type(value)}
}
function identifier(value: unknown): Shape {
  return {...field(value),...(typeof value==='string'?{
    empty:value.length===0,whitespace:/\s/.test(value),control:/[\u0000-\u001f\u007f-\u009f]/.test(value),
    nonAscii:/[^\x00-\x7f]/.test(value),
  }:{})}
}
/** Categories only: never hostname, URL, query, credentials or DNS/network I/O. */
function urlClass(value: unknown): string {
  if(typeof value!=='string')return type(value)
  if(value==='')return 'empty'
  try {
    const url=new URL(value)
    if(url.username || url.password)return 'credentials'
    if(url.protocol!=='https:')return 'non_https'
    if(isIP(url.hostname.replace(/^\[|\]$/g,'')))return 'ip_literal'
    if(!url.hostname.includes('.'))return 'single_label'
    if(/(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion)$/.test(url.hostname))return 'special_name'
    return 'dns_name'
  } catch { return 'invalid_url' }
}
const ENVELOPE=['id','event','timestamp','data'] as const
const DATA=['eventId','mailboxAddress','messageId','inReplyTo','references','subject','from','to','cc','date','plainBody','htmlBody','bodyUrl','attachments'] as const
const ATTACHMENT=['contentType','filename','sizeBytes','fileUrl'] as const
/** Only fixed documented field NAMES are traversed; unknown keys are counted, never named,
 * so a hostile key cannot turn into log content. Values are never returned.
 */
function knownShape(value: unknown, keys: readonly string[]): Shape {
  const record=object(value)?value:{}
  return {type:type(value),unknownKeys:Object.keys(record).filter(key=>!keys.includes(key)).length,
    fields:Object.fromEntries(keys.map(key=>[key,field(record[key])]))}
}
/** Authenticated rejected JSON only. Fixed schema, bounded output, no application state. */
export function describeHostingerStructure(value: unknown, configuredMailbox: string): Shape {
  const envelope=object(value)?value:{},data=object(envelope.data)?envelope.data:{}
  const attachments=Array.isArray(data.attachments)?data.attachments:[]
  const first=object(attachments[0])?attachments[0]:{}
  return {version:2,envelope:knownShape(value,ENVELOPE),data:knownShape(envelope.data,DATA),
    identifiers:{delivery:identifier(envelope.id),event:identifier(data.eventId)},
    eventKnown:envelope.event==='message.received',
    mailboxRole:typeof data.mailboxAddress!=='string'?type(data.mailboxAddress):data.mailboxAddress.trim().toLowerCase()===configuredMailbox?'configured':'other',
    urls:{body:urlClass(data.bodyUrl),firstAttachment:urlClass(first.fileUrl)},
    firstAttachment:knownShape(attachments[0],ATTACHMENT)}
}
/** Accepted receipts: how many undocumented data keys arrived. A count only, never a name. */
export function unknownDataKeys(value: unknown): number {
  const data=object(value)&&object(value.data)?value.data:{}
  return Object.keys(data).filter(key=>!(DATA as readonly string[]).includes(key)).length
}
