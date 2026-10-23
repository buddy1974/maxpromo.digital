import test from 'node:test'
import assert from 'node:assert/strict'
import { assessMailRisk } from './risk'

test('invoice lure shape: automated sender with an HTML attachment is suspect and not replyable', () => {
  // Shape of the 2026-10-23 production message Hostinger filed into Junk; no sender is hard-coded.
  const risk = assessMailRisk({ sender: 'no-reply@unrelated-domain.example', attachments: [{ filename: '2026-KV-0141_Rechnung_.html' }] })
  assert.deepEqual(risk, { signals: ['active_attachment', 'automated_sender'], suspect: true, replyable: false })
})
test('a human invoice with a PDF raises no signal', () => {
  assert.deepEqual(assessMailRisk({ sender: 'accounts@supplier.example', attachments: [{ filename: 'Rechnung 2026-17.pdf' }] }),
    { signals: [], suspect: false, replyable: true })
})
test('active and disguised attachments are detected case-insensitively', () => {
  for (const filename of ['x.HTM', 'scan.svg', 'run.js', 'setup.EXE', 'disk.iso', 'shortcut.lnk']) assert.ok(assessMailRisk({ sender: 'a@b.example', attachments: [{ filename }] }).suspect, filename)
  assert.deepEqual(assessMailRisk({ sender: 'a@b.example', attachments: [{ filename: 'invoice.pdf.scr' }] }).signals, ['active_attachment', 'double_extension'])
  assert.deepEqual(assessMailRisk({ sender: 'a@b.example', attachments: [{ filename: 'invoice.pdf.xyz' }] }).signals, ['double_extension'])
  assert.equal(assessMailRisk({ sender: 'a@b.example', attachments: [{ filename: 'archive.pdf.zip' }] }).suspect, false)
})
test('automated mailbox names only affect reply attention, never quarantine', () => {
  for (const sender of ['noreply@x.example', 'do-not-reply@x.example', 'mailer-daemon@x.example', 'notifications+abc@x.example']) {
    const risk = assessMailRisk({ sender, attachments: [] })
    assert.equal(risk.replyable, false, sender); assert.equal(risk.suspect, false, sender)
  }
  assert.equal(assessMailRisk({ sender: 'replyteam@x.example', attachments: [] }).replyable, true)
})
