/** Exact public example supplied from Hostinger's UI by Marcel, 2026-10-23.
 * No placeholder URL in this fixture is ever a download candidate or business message.
 */
export const HOSTINGER_CONNECTIVITY_SAMPLE = {
  id: '82470320-5364-57eb-8c8e-8004ec3c9573', event: 'message.received',
  timestamp: '2026-04-03T12:00:00.422776Z',
  data: {
    eventId: '9f2b1c0d4e5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e',
    mailboxAddress: 'test@hostinger.com', messageId: '<a@b.com>', inReplyTo: '<b@b.com>',
    references: ['<a@b.com>', '<b@b.com>'], subject: 'test email', from: 'Foo <foo@hostinger.com>',
    to: ['Admin <test@hostinger.com>'], cc: [], date: 'Fri,  3 Apr 2026 06:21:33 +0000 (UTC)',
    plainBody: 'abc 123', htmlBody: '', bodyUrl: 'https://download-url',
    attachments: [{contentType:'application/pdf',filename:'document.pdf',sizeBytes:12345,fileUrl:'https://download-url'}],
  },
}

/** Bounded by the fixed expected shape: key order is irrelevant; extra keys/any changed
 * value fail. This is a connectivity acknowledgement, never an inbound-mail parser.
 */
function exact(value: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) return Array.isArray(value) && value.length===expected.length && expected.every((item,index)=>exact(value[index],item))
  if (expected && typeof expected==='object') {
    if (!value || typeof value!=='object' || Array.isArray(value)) return false
    const actual=value as Record<string,unknown>, fields=expected as Record<string,unknown>
    return Object.keys(actual).length===Object.keys(fields).length && Object.keys(fields).every(name=>Object.prototype.hasOwnProperty.call(actual,name) && exact(actual[name],fields[name]))
  }
  return value===expected
}
export function isHostingerConnectivityTest(value: unknown): boolean {
  return exact(value,HOSTINGER_CONNECTIVITY_SAMPLE)
}
