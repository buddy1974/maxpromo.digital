import test from 'node:test'
import assert from 'node:assert/strict'
import { createMailContentStore } from './contentStore'
import { HOSTINGER_ACCOUNT, sealLocators } from './hostingerIngestion'
import type { Sql } from '../commercial/types'

test('reclaimed job cannot lend its lease token to a stale worker',async()=>{
  const secret='local-lease-fixture-'.repeat(4)
  let lease=0
  const writes:unknown[][]=[]
  const sql=(async(strings:TemplateStringsArray,...values:unknown[])=>{
    const query=strings.join('?')
    if(query.includes('RETURNING id')) return [{id:'job',message_id:'message',expires_at:'2026-10-23',lease_token:`lease-${++lease}`,sealed_locator:sealLocators({bodyUrl:'https://downloads.hostinger.com/body',attachments:[]},secret,`${HOSTINGER_ACCOUNT}:event`)}]
    if(query.includes('SELECT account_id')) return [{account_id:HOSTINGER_ACCOUNT,provider_message_id:'event',attachments:[],subject:'Enquiry'}]
    writes.push(values)
    return [{completed:values[1]===`lease-${lease}`}]
  }) as unknown as Sql
  const store=createMailContentStore(sql,secret)
  const first=await store.claim('job',new Date('2026-10-22'))
  const second=await store.claim('job',new Date('2026-10-22'))
  assert.ok(first);assert.ok(second)
  await assert.rejects(()=>store.complete(first,'stale body',[]),/lease_expired/)
  await store.complete(second,'current body',[])
  await store.fail(first,'failed')
  assert.equal(writes[0][1],'lease-1')
  assert.equal(writes[1][1],'lease-2')
  assert.equal(writes[2].at(-1),'lease-1')
})
