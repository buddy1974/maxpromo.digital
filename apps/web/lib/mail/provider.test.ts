import assert from 'node:assert/strict'
import { test } from 'node:test'
import { HostingerMailProvider, MailProviderError, verifyWebhookBearer, readBoundedPayload } from './provider'

const gate = { enabled: true, fixtureVerified: true, isEvidenceMode: () => false }
function provider(transport: typeof fetch, overrides: Partial<ConstructorParameters<typeof HostingerMailProvider>[0]> = {}) {
  return new HostingerMailProvider({ transport, token: 'offline-token', mailboxResourceId: 'ACfixture', gate, ...overrides })
}
test('all live gates fail closed before transport', async () => {
  let calls = 0
  const transport: typeof fetch = async () => { calls++; throw new Error('Forbidden') }
  for (const denied of [undefined, { ...gate, enabled: false }, { ...gate, fixtureVerified: false }, { ...gate, isEvidenceMode: () => true }]) {
    await assert.rejects(provider(transport, { gate: denied }).list('INBOX'), (error: unknown) => error instanceof MailProviderError && error.outcome === 'blocked')
  }
  assert.equal(calls, 0)
})
test('verified routes encode folders and use real payload contracts', async () => {
  const calls: { url: string; init: RequestInit | undefined }[] = []
  const transport: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    return init?.method === 'POST' && !String(url).includes('/search') ? new Response(null, { status: 204 }) : Response.json({ data: [], pagination: { page: 1, perPage: 25, total: 0, totalPages: 0 } })
  }
  const mail = provider(transport)
  await mail.list('INBOX/Customers', { perPage: 100 })
  await mail.search('INBOX', { text: 'invoice' }, { page: 2 })
  await mail.move({ folder: 'INBOX', uid: 2 }, 'INBOX.Archive')
  await mail.send({ to: ['owner@example.com'], text: 'Approved', inReplyTo: { folder: 'INBOX', uid: 2 } })
  assert.match(calls[0].url, /INBOX%2FCustomers\/messages\?perPage=100$/)
  assert.match(calls[1].url, /messages\/search\?page=2$/)
  assert.equal(calls[1].init?.body, JSON.stringify({ text: 'invoice' }))
  assert.equal(calls[2].init?.body, JSON.stringify({ targetFolder: 'INBOX.Archive' }))
  assert.equal(calls[3].init?.headers && new Headers(calls[3].init.headers).get('Authorization'), 'Bearer offline-token')
  assert.equal(new Headers(calls[3].init?.headers).has('Idempotency-Key'), false)
  assert.equal(calls[3].init?.redirect, 'error')
})
test('send transport and upstream failures are uncertain and never retried', async () => {
  for (const fail of ['timeout', 'upstream']) {
    let calls = 0
    const mail = provider(async () => { calls++; if (fail === 'timeout') throw new Error('sensitive token'); return new Response('private content', { status: 502 }) })
    await assert.rejects(mail.send({ to: ['owner@example.com'], text: 'Approved' }), (error: unknown) => error instanceof MailProviderError && error.outcome === 'uncertain' && !error.message.includes('sensitive'))
    assert.equal(calls, 1)
  }
})
test('invalid requests fail before transport', async () => {
  let calls = 0
  const mail = provider(async () => { calls++; return new Response(null, { status: 204 }) })
  await assert.rejects(mail.list('INBOX', { perPage: 101 }))
  await assert.rejects(mail.get({ folder: 'INBOX', uid: 0 }))
  await assert.rejects(mail.send({ to: ['victim@example.com\r\nBcc:x@example.com'] }))
  await assert.rejects(mail.flags({ folder: 'INBOX', uid: 1 }, {}))
  assert.equal(calls, 0)
})
test('Bearer verification requires configured exact secret', () => {
  assert.equal(verifyWebhookBearer('Bearer secret', 'secret'), true)
  for (const header of [null, 'secret', 'Bearer wrong', 'Bearer secret ']) assert.equal(verifyWebhookBearer(header, 'secret'), false)
  assert.equal(verifyWebhookBearer('Bearer ', ''), false)
})
test('payload limit checks actual bytes and valid UTF-8', async () => {
  assert.equal(await readBoundedPayload(new Request('https://example.com', { method: 'POST', body: 'ä' }), 2), 'ä')
  await assert.rejects(readBoundedPayload(new Request('https://example.com', { method: 'POST', body: 'ä' }), 1), /Payload too large/)
  await assert.rejects(readBoundedPayload(new Request('https://example.com', { method: 'POST', body: new Uint8Array([255]) })))
})
const message = { uid: 42, path: 'INBOX', date: '2026-10-22T10:00:00Z', flags: [], unseen: true, size: 20, subject: 'Invoice', from: { name: 'Example', address: 'client@example.com' }, to: [], cc: [], bcc: [], messageId: '<42@example.com>', inReplyTo: null, attachments: [] }
test('get, folder list and flag changes retain exact envelope and path contracts', async () => {
  const calls: { url: string; init: RequestInit | undefined }[] = []
  const transport: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    return Response.json(String(url).endsWith('/folders?page=1')
      ? { data: [{ path: 'INBOX', name: 'Inbox', delimiter: '.', specialUse: null, messageCount: 1, unreadCount: 1 }], pagination: { page: 1, perPage: 25, total: 1, totalPages: 1 } }
      : { data: message })
  }
  const mail = provider(transport)
  assert.deepEqual(await mail.get({ folder: 'INBOX', uid: 42 }), message)
  assert.equal((await mail.folders({ page: 1 })).data[0].path, 'INBOX')
  assert.deepEqual(await mail.flags({ folder: 'INBOX', uid: 42 }, { addFlags: ['\\Seen'], removeFlags: ['\\Flagged'] }), message)
  assert.match(calls[0].url, /\/folders\/INBOX\/messages\/42$/)
  assert.equal(calls[0].init?.method, 'GET')
  assert.equal(calls[2].init?.method, 'PATCH')
  assert.equal(calls[2].init?.body, JSON.stringify({ addFlags: ['\\Seen'], removeFlags: ['\\Flagged'] }))
})
test('malformed envelopes, records, JSON and pagination fail closed', async () => {
  const validPagination = { page: 1, perPage: 25, total: 0, totalPages: 0 }
  for (const payload of [null, {}, [], { data: [] }, { data: 'bad', pagination: validPagination },
    { data: [{}], pagination: validPagination }, { data: [], pagination: { ...validPagination, page: 0 } },
    { data: [], pagination: { ...validPagination, perPage: 101 } }, { data: [], pagination: { ...validPagination, total: -1 } },
    { data: [], pagination: { ...validPagination, totalPages: '1' } }, { data: [], pagination: { ...validPagination, page: 1.5 } }]) {
    await assert.rejects(provider(async () => Response.json(payload)).list('INBOX'), MailProviderError)
  }
  for (const payload of [{ data: null }, { data: { ...message, uid: -1 } }, { data: { ...message, from: {} } }, { data: { ...message, attachments: [{}] } }]) {
    await assert.rejects(provider(async () => Response.json(payload)).get({ folder: 'INBOX', uid: 1 }), MailProviderError)
  }
  await assert.rejects(provider(async () => new Response('{')).list('INBOX'), MailProviderError)
  await assert.rejects(provider(async () => new Response(null, { status: 204 })).list('INBOX'), MailProviderError)
})
test('HTTP 429 and authorization failures are surfaced once without leaking provider body', async () => {
  for (const status of [401, 403, 429]) {
    let calls = 0
    const mail = provider(async () => { calls++; return new Response('private sender and token', { status }) })
    await assert.rejects(mail.send({ to: ['owner@example.com'] }), (error: unknown) => error instanceof MailProviderError && error.outcome === 'failed' && error.status === status && !error.message.includes('private'))
    assert.equal(calls, 1)
  }
})
test('transport receives a bounded abort signal and does not retry an aborted send', async () => {
  let calls = 0
  const mail = provider(async (_url, init) => {
    calls++
    assert.ok(init?.signal)
    // Keep the fake transport alive until AbortSignal.timeout fires (it is unrefed).
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 200)
      init.signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('aborted')) }, { once: true })
    })
    return new Response(null, { status: 204 })
  }, { timeoutMs: 5 })
  await assert.rejects(mail.send({ to: ['owner@example.com'] }), (error: unknown) => error instanceof MailProviderError && error.outcome === 'uncertain')
  assert.equal(calls, 1)
})
test('forged content-length cannot bypass streamed payload limits', async () => {
  const request = new Request('https://example.com', { method: 'POST', body: '123456', headers: { 'content-length': '1' } })
  await assert.rejects(readBoundedPayload(request, 3), /Payload too large/)
})
