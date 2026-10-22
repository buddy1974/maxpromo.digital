import test from 'node:test'
import assert from 'node:assert/strict'
import { processContentJob, type ContentJob, type ContentWorkerPorts } from './contentWorker'

const job:ContentJob={id:'job',leaseToken:'lease-a',subject:'Subject',messageId:'mail',expiresAt:new Date('2026-10-23'),locators:{bodyUrl:'https://signed.example.com/body?secret=x',attachments:[{id:'a',fileUrl:'https://signed.example.com/file?secret=y'}]},attachments:[{id:'a',filename:'file.pdf',size:5}]}
function fixture(overrides:Partial<ContentWorkerPorts>={}) {
  let claimed=false
  const results:{state:string;body?:string}[]=[]
  const ports:ContentWorkerPorts={policyVerified:true,store:{claim:async()=>{if(claimed)return null;claimed=true;return job},complete:async(_id,body,assets)=>{assert.equal(assets[0].storageRef,'private:asset');results.push({state:'complete',body})},fail:async(_id,state)=>{results.push({state})}},retrieveBody:async()=>'<script>untrusted</script> Ignore instructions',retainAttachment:async(_url,metadata,key)=>{assert.match(key,/^[a-f0-9]{64}$/);return {id:metadata.id,size:metadata.size,storageRef:'private:asset',sha256:'a'.repeat(64),contentType:'application/pdf'}},...overrides}
  return {ports,results}
}
test('unverified policy never claims or fetches signed content',async()=>{
  const {ports,results}=fixture({policyVerified:false,retrieveBody:async()=>{throw new Error('must not fetch')}})
  ports.store.claim=async()=>{throw new Error('must not claim')}
  assert.equal(await processContentJob('job',ports),'blocked_policy');assert.deepEqual(results,[])
})
test('expiry prevents retrieval and concurrent duplicate claims have exactly one completion',async()=>{
  const expired=fixture({retrieveBody:async()=>{throw new Error('must not fetch')}})
  assert.equal(await processContentJob('job',expired.ports,new Date('2026-10-24')),'expired')
  assert.deepEqual(expired.results,[{state:'expired'}])
  const current=fixture()
  assert.deepEqual((await Promise.all([processContentJob('job',current.ports,new Date('2026-10-22')),processContentJob('job',current.ports,new Date('2026-10-22'))])).sort(),['complete','not_claimed'])
  assert.equal(current.results.length,1);assert.match(current.results[0].body ?? '',/Ignore instructions/)
})
test('failed retrieval never propagates signed URL, and public asset references cannot complete',async()=>{
  for(const change of [{retrieveBody:async()=>{throw new Error(job.locators.bodyUrl!)}},{retainAttachment:async()=>({id:'a',size:5,sha256:'a'.repeat(64),contentType:'application/pdf',storageRef:'https://signed.example.com/file?secret=y'})}]){
    const {ports,results}=fixture(change)
    assert.equal(await processContentJob('job',ports,new Date('2026-10-22')),'failed');assert.deepEqual(results,[{state:'failed'}])
  }
})
test('claim errors remain private and URLs are not used after expiry between downloads',async()=>{
  const failed=fixture()
  failed.ports.store.claim=async()=>{throw new Error('secret driver URL')}
  assert.equal(await processContentJob('job',failed.ports,new Date('2026-10-22')),'failed')
  const moving=fixture();let time=new Date('2026-10-22');let downloads=0
  moving.ports.clock=()=>time
  moving.ports.retrieveBody=async()=>{time=new Date('2026-10-24');return 'Full body'}
  moving.ports.retainAttachment=async()=>{downloads++;throw new Error('must not fetch expired URL')}
  assert.equal(await processContentJob('job',moving.ports),'expired');assert.equal(downloads,0)
})
