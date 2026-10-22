import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchSignedContent, isPublicAddress, persistAttachment, validateSignedUrl, type SignedContentOptions } from './content'

const url = 'https://downloads.hostinger.com/body?signature=private'
const options = (overrides: Partial<SignedContentOptions> = {}): SignedContentOptions => ({
  allowedHosts:['downloads.hostinger.com'],resolve:async () => ['8.8.8.8'],
  transport:async request => { assert.equal(request.address,'8.8.8.8'); assert.equal(request.redirect,'error'); return new Response('full body',{headers:{'content-type':'text/plain'}}) },
  maxBytes:1024,...overrides,
})
test('signed URLs reject SSRF syntax without leaking signed URLs in errors', () => {
  for (const value of ['http://example.com/a','https://127.0.0.1/a','https://[::1]/a','https://2130706433/a','https://localhost/a','https://metadata.google.internal/a','https://x.local/a','https://x/a','https://u:p@example.com/a','https://example.com:444/a','https://example.com/a#secret','https://example.com/%2e%2e/a','https://example.com/../a','https://example.com\\@evil.com/a']) {
    assert.throws(() => validateSignedUrl(value), {message:'invalid_signed_content'})
  }
  assert.equal(validateSignedUrl(url),url)
})
test('DNS addresses deny private special and mapped networks', () => {
  for (const address of ['0.0.0.0','10.0.0.1','127.0.0.1','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','192.0.2.1','198.18.0.1','198.51.100.1','203.0.113.1','224.0.0.1','255.255.255.255','::1','::ffff:8.8.8.8','::ffff:0808:0808','fc00::1','fe80::1','2001:db8::1','2002:0808:0808::1','3fff::1','invalid']) assert.equal(isPublicAddress(address),false,address)
  assert.equal(isPublicAddress('8.8.8.8'),true)
  assert.equal(isPublicAddress('2606:4700::1111'),true)
})
test('retrieval requires verified exact host and all-public DNS before pinned transport', async () => {
  let calls = 0
  const transport: SignedContentOptions['transport'] = async () => {calls++;return new Response('x')}
  await assert.rejects(fetchSignedContent(url,options({allowedHosts:[],transport})))
  await assert.rejects(fetchSignedContent(url,options({allowedHosts:['hostinger.com'],transport})))
  await assert.rejects(fetchSignedContent(url,options({resolve:async () => ['8.8.8.8','127.0.0.1'],transport})))
  await assert.rejects(fetchSignedContent(url,options({resolve:async () => [],transport})))
  assert.equal(calls,0)
  const content = await fetchSignedContent(url,options())
  assert.equal(Buffer.from(content.bytes).toString(),'full body')
})
test('retrieval denies redirects, oversized streams, MIME mismatch, transport errors and timeouts', async () => {
  for (const config of [
    {transport:async () => new Response(null,{status:302,headers:{location:'https://127.0.0.1'}})},
    {transport:async () => new Response('too large'),maxBytes:2},
    {transport:async () => new Response('x',{headers:{'content-length':'9999'}})},
    {expectedType:'application/json'},
    {transport:async () => {throw new Error(url)}},
    {resolve:async () => new Promise<string[]>(() => undefined),timeoutMs:5},
    {transport:async () => new Promise<Response>(() => undefined),timeoutMs:5},
  ]) await assert.rejects(fetchSignedContent(url,options(config)), error => error instanceof Error && !error.message.includes('signature'))
  let lateRequests=0
  await assert.rejects(fetchSignedContent(url,options({resolve:async()=>{await new Promise(resolve=>setTimeout(resolve,15));return ['8.8.8.8']},
    transport:async()=>{lateRequests++;return new Response('must not fetch')},timeoutMs:2})))
  await new Promise(resolve=>setTimeout(resolve,20))
  assert.equal(lateRequests,0,'Expired DNS resolution must not initiate a later request')
})
test('durable sink receives sanitized metadata, verified magic and digest, never signed URLs', async () => {
  const result = await persistAttachment({bytes:Buffer.from('<script>evil()</script>'),contentType:'application/pdf'},'../../secret\\evil.html',{
    put:async (_bytes,metadata) => {assert.equal(metadata.contentType,'application/octet-stream'); assert.ok(!metadata.filename.includes('..'));assert.equal(metadata.sha256.length,64); assert.ok(!JSON.stringify(metadata).includes('signature'));return 'private:sha256'},
  })
  assert.equal(result.storageRef,'private:sha256')
  await assert.rejects(persistAttachment({bytes:new Uint8Array(),contentType:'text/plain'},'x',{put:async () => 'unreachable'}))
})
