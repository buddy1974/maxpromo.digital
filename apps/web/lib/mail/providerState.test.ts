import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyFolders, hostingerStateReader, locateMessage, reconcileProviderState, type ProviderStateReader } from './providerState'
import type { ProviderFolder, ProviderMessage, SearchCriteria } from './provider'
import type { Sql } from '../commercial/types'

const folder = (path: string, specialUse: string | null): ProviderFolder => ({ path, name: path.split('.').pop()!, delimiter: '.', specialUse, messageCount: 1, unreadCount: 0 })
// The real Hostinger layout observed on info@maxpromo.digital, plus a localized Junk name.
const FOLDERS = [folder('INBOX', '\\Inbox'), folder('INBOX.Junk', '\\Junk'), folder('INBOX.Trash', '\\Trash'), folder('INBOX.Notes', null)]
const ID = '<phish-1@sender.example>'
const message = (path: string, messageId: string): ProviderMessage => ({ uid: 35, path, date: '2026-10-23T15:58:15Z', flags: [], unseen: true, size: 1,
  subject: 's', from: null, to: [], cc: [], bcc: [], messageId, inReplyTo: null, attachments: [] })
function reader(location: Record<string, string>, calls: { folder: string; criteria: SearchCriteria }[] = [], fail = false): ProviderStateReader {
  return {
    async folders() { if (fail) throw new Error('provider said https://secret.invalid'); return { data: FOLDERS, pagination: { page: 1, perPage: 100, total: 4, totalPages: 1 } } },
    async search(folderPath, criteria) {
      calls.push({ folder: folderPath, criteria })
      const id = String(criteria.header).slice('Message-ID:'.length)
      const data = location[id] === folderPath ? [message(folderPath, id)] : []
      return { data, pagination: { page: 1, perPage: 5, total: data.length, totalPages: 1 } }
    },
  }
}
interface Call { text: string; values: unknown[] }
function fakeSql(rows: Record<string, unknown>[], outcome = 'quarantined') {
  const calls: Call[] = []
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?'); calls.push({ text, values })
    if (text.includes("provider_state='unverified'") && text.startsWith('SELECT')) return rows
    if (text.includes('apply_provider_state')) return [{ outcome }]
    return []
  }) as unknown as Sql
  return { sql, calls }
}
const pending = (checks = 0) => [{ id: '00000000-0000-4000-8000-000000000001', rfc_message_id: ID, received_at: new Date('2026-10-23T15:58:24Z'), provider_checks: checks }]

test('folder meaning comes from IMAP special-use, never from localized names', () => {
  assert.deepEqual(classifyFolders(FOLDERS), { inbox: 'INBOX', junk: 'INBOX.Junk', trash: 'INBOX.Trash' })
  assert.equal(classifyFolders([folder('INBOX.Spam', '\\Junk')]).junk, 'INBOX.Spam')
  assert.equal(classifyFolders([folder('INBOX.Junk', null)]).junk, null)
})
test('provider spam: a message Hostinger filed into Junk is located there by Message-ID header, Junk first', async () => {
  const calls: { folder: string; criteria: SearchCriteria }[] = []
  const found = await locateMessage(reader({ [ID]: 'INBOX.Junk' }, calls), classifyFolders(FOLDERS), ID, new Date('2026-10-23T15:58:24Z'))
  assert.deepEqual(found, { state: 'junk', folder: 'INBOX.Junk', uid: 35 })
  assert.deepEqual(calls, [{ folder: 'INBOX.Junk', criteria: { header: `Message-ID:${ID}`, since: '2026-10-21' } }])
})
test('inbox and absent messages are reported as such; unsafe ids are never searched', async () => {
  const folders = classifyFolders(FOLDERS)
  assert.equal((await locateMessage(reader({ [ID]: 'INBOX' }), folders, ID, new Date())).state, 'inbox')
  assert.equal((await locateMessage(reader({}), folders, ID, new Date())).state, 'not_found')
  const calls: { folder: string; criteria: SearchCriteria }[] = []
  for (const bad of ['', 'no-brackets@x', '<a b@x>', '<a@x>\r\nX-Injected: 1']) assert.equal((await locateMessage(reader({}, calls), folders, bad, new Date())).state, 'not_found')
  assert.equal(calls.length, 0)
})
test('reconcile applies provider Junk through the SQL function and counts the quarantine', async () => {
  const { sql, calls } = fakeSql(pending())
  assert.deepEqual(await reconcileProviderState(sql, reader({ [ID]: 'INBOX.Junk' })), { configured: true, checked: 1, quarantined: 1, failed: false })
  const apply = calls.find(call => call.text.includes('apply_provider_state'))!
  assert.deepEqual(apply.values.slice(1), ['junk', 'INBOX.Junk', 35])
})
test('a message not yet found is retried, then recorded as not_found after the bounded attempts', async () => {
  const early = fakeSql(pending(0))
  await reconcileProviderState(early.sql, reader({}))
  assert.ok(early.calls.some(call => call.text.includes('provider_checks=provider_checks+1')))
  assert.ok(!early.calls.some(call => call.text.includes('apply_provider_state')))
  const late = fakeSql(pending(4))
  await reconcileProviderState(late.sql, reader({}))
  assert.equal(late.calls.find(call => call.text.includes('apply_provider_state'))?.values[1], 'not_found')
})
test('no provider connection means no SQL and no provider call; provider failure is contained', async () => {
  const off = fakeSql(pending())
  assert.deepEqual(await reconcileProviderState(off.sql, null), { configured: false, checked: 0, quarantined: 0, failed: false })
  assert.equal(off.calls.length, 0)
  const broken = fakeSql(pending())
  assert.deepEqual(await reconcileProviderState(broken.sql, reader({}, [], true)), { configured: true, checked: 0, quarantined: 0, failed: true })
})
test('the REST reader is read-only, gated by configuration and refused in evidence mode', async () => {
  let transported = 0
  const transport = (async (url: string, init: RequestInit) => {
    transported++
    assert.ok(/\/folders(\/INBOX\.Junk\/messages\/search)?(\?|$)/.test(String(url)), String(url)); assert.ok(['GET', 'POST'].includes(String(init.method)))
    return Response.json({ data: [], pagination: { page: 1, perPage: 100, total: 0, totalPages: 0 } })
  }) as unknown as typeof fetch
  assert.equal(hostingerStateReader({}, transport), null)
  assert.equal(hostingerStateReader({ HOSTINGER_MAIL_API_TOKEN: 't', HOSTINGER_MAILBOX_RESOURCE_ID: 'AC1', MAXPROMO_EVIDENCE_MODE: '1' }, transport), null)
  const live = hostingerStateReader({ HOSTINGER_MAIL_API_TOKEN: 't', HOSTINGER_MAILBOX_RESOURCE_ID: 'AC1' }, transport)!
  assert.deepEqual(Object.keys(live).sort(), ['folders', 'search'])
  await live.folders({ perPage: 100 }); await live.search('INBOX.Junk', { header: `Message-ID:${ID}` })
  assert.equal(transported, 2)
})
