/**
 * Offline proof: outgoing attachments are decided by their bytes, and delivery failure reports are
 * read without guessing (migration 0020). No database, network or real mail.
 */
import assert from 'node:assert/strict'
import { attachableType, safeFilename, MAX_ATTACHMENT_BYTES } from '../../lib/mail/draftAttachments.ts'
import { isBounceSender, parseBounce } from '../../lib/mail/bounces.ts'

let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }
const bytes = (...v: number[]) => new Uint8Array([...v, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20])
const text = (s: string) => new TextEncoder().encode(s)

check('a real PDF is a PDF', attachableType('Rechnung.pdf', text('%PDF-1.7 ...')) === 'application/pdf')
check('a PNG, JPEG, GIF and WebP are recognised by their signatures', attachableType('a.png', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) === 'image/png'
  && attachableType('a.jpg', bytes(0xff, 0xd8, 0xff, 0xe0)) === 'image/jpeg' && attachableType('a.gif', text('GIF89a....')) === 'image/gif'
  && attachableType('a.webp', new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50])) === 'image/webp')
check('Word/Excel/PowerPoint must be Office Open XML (zip) files', attachableType('a.docx', bytes(0x50, 0x4b, 0x03, 0x04)) !== null && attachableType('a.xlsx', text('not a zip')) === null)
check('text and CSV must be valid UTF-8 without NUL bytes', attachableType('a.csv', text('a;b\n1;2')) === 'text/csv' && attachableType('a.txt', new Uint8Array([0x61, 0, 0x62])) === null && attachableType('a.txt', new Uint8Array([0xff, 0xfe, 0xfd])) === null)
check('a renamed executable is refused: the name says PDF, the bytes say otherwise', attachableType('invoice.pdf', text('MZ\x90\x00 executable')) === null)
check('executables, scripts, HTML, SVG and archives are never attachable', ['a.exe', 'a.js', 'a.html', 'a.svg', 'a.zip', 'a.bat', 'a.ps1', 'a.docm'].every(n => attachableType(n, text('%PDF-')) === null))
check('file names lose paths and control characters', safeFilename('../../etc/passwd.txt') === 'passwd.txt' && safeFilename('C:\\Users\\x\\a\u0000b.pdf') === 'ab.pdf' && safeFilename('noextension') === null && safeFilename('..pdf') === null)
check('the per-file limit is 4 MB', MAX_ATTACHMENT_BYTES === 4 * 1024 * 1024)

const postfix = `This is the mail system at host mx.example.\n\nI'm sorry to have to inform you that your message could not\nbe delivered to one or more recipients.\n\n<jonas@weber.example>: host mx.weber.example[1.2.3.4] said: 550 5.1.1\n    <jonas@weber.example>: Recipient address rejected: User unknown\n\nReporting-MTA: dns; mx.example\n\nFinal-Recipient: rfc822; jonas@weber.example\nAction: failed\nStatus: 5.1.1\nDiagnostic-Code: smtp; 550 5.1.1 <jonas@weber.example>: Recipient address rejected: User unknown\n\nMessage-ID: <abc123@maxpromo.digital>\nSubject: Rechnung Nr. MP-2026-002`
const b = parseBounce(postfix)!
check('a permanent DSN is a bounce with recipient, status and diagnostic', b.kind === 'bounced' && b.recipients[0] === 'jonas@weber.example' && b.status === '5.1.1' && b.detail.includes('User unknown'))
check('the quoted Message-ID of the original is read to find the exact message', b.messageIds.includes('<abc123@maxpromo.digital>'))
const human = parseBounce('Delivery has failed to these recipients.\n\n<a@b.example>: 552 5.2.2 mailbox full\n\n')!
check('a report with only the human part is still read', human.kind === 'bounced' && human.recipients[0] === 'a@b.example' && human.status === '5.2.2')
check('a temporary failure is "delayed", not bounced', parseBounce('Final-Recipient: rfc822; a@b.example\nAction: delayed\nStatus: 4.4.1\n')?.kind === 'delayed')
check('a report naming no recipient links to nothing', parseBounce('Your message could not be delivered.') === null)
check('ordinary mail is never a bounce', parseBounce('Hallo Marcel, danke für das Angebot.') === null)
check('only MAILER-DAEMON / postmaster count as report senders', isBounceSender('MAILER-DAEMON@mx1.hostinger.com') && isBounceSender('Mail Delivery System <postmaster@x.example>') && !isBounceSender('jonas@weber.example') && !isBounceSender('mailer-daemon-fan@gmail.com'))
console.log(`${passed} attachment and delivery-report assertions passed; no network, database or real mail.`)
