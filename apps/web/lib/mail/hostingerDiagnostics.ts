import { isIP } from 'node:net'
import { HOSTINGER_CONNECTIVITY_SAMPLE, isHostingerConnectivityTest } from './hostingerConnectivity'

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
    empty:value.length===0,valid:/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$/.test(value),
    whitespace:/\s/.test(value),nonAscii:/[^\x00-\x7f]/.test(value),
    otherCharacters:/[^A-Za-z0-9_.:-]/.test(value),
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
/** Traversal follows ONLY the fixed public expected keys/array slots. Unknown names and
 * values are never returned, even if an attacker uses a secret as a property name.
 */
function mismatches(value: unknown, expected: unknown, path='$'): string[] {
  if(Array.isArray(expected)) {
    if(!Array.isArray(value))return [path]
    return [...(value.length!==expected.length?[`${path}.length`]:[]),...expected.flatMap((item,index)=>mismatches(value[index],item,`${path}[${index}]`))]
  }
  if(object(expected)) {
    if(!object(value))return [path]
    return [...(Object.keys(value).some(key=>!Object.prototype.hasOwnProperty.call(expected,key))?[`${path}.$unknownKeys`]:[]),
      ...Object.keys(expected).flatMap(key=>mismatches(value[key],expected[key],`${path}.${key}`))]
  }
  return value===expected?[]:[path]
}
function knownShape(value: unknown, expected: Shape): Shape {
  const record=object(value)?value:{}
  return {type:type(value),unknownKeys:object(value)?Object.keys(value).filter(key=>!Object.prototype.hasOwnProperty.call(expected,key)).length:0,
    fields:Object.fromEntries(Object.keys(expected).map(key=>[key,field(record[key])]))}
}
/** Authenticated rejected JSON only. Fixed schema, bounded output, no application state. */
export function describeHostingerStructure(value: unknown): Shape {
  const envelope=object(value)?value:{},data=object(envelope.data)?envelope.data:{}
  const attachments=Array.isArray(data.attachments)?data.attachments:[]
  const first=object(attachments[0])?attachments[0]:{}
  const result: Shape={version:1,matcherMatched:isHostingerConnectivityTest(value),
    mismatchFields:mismatches(value,HOSTINGER_CONNECTIVITY_SAMPLE),
    envelope:knownShape(value,HOSTINGER_CONNECTIVITY_SAMPLE),data:knownShape(envelope.data,HOSTINGER_CONNECTIVITY_SAMPLE.data),
    identifiers:{delivery:identifier(envelope.id),event:identifier(data.eventId)},
    mailboxRole:data.mailboxAddress==='info@maxpromo.digital'?'configured':data.mailboxAddress==='test@hostinger.com'?'documented_test':typeof data.mailboxAddress==='string'?'other':type(data.mailboxAddress),
    urls:{body:urlClass(data.bodyUrl),firstAttachment:urlClass(first.fileUrl)},
    firstAttachment:knownShape(attachments[0],HOSTINGER_CONNECTIVITY_SAMPLE.data.attachments[0]),
    testMarkers:Object.fromEntries(['test','isTest','is_test'].map(key=>[key,{type:type(envelope[key]),...(typeof envelope[key]==='boolean'?{booleanValue:envelope[key]}:{})}]))}
  return result
}
