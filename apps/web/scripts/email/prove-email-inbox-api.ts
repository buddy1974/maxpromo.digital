/** Real Inbox GET route with deterministic auth/database ports. No real records or network. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const id = '10000000-0000-0000-0000-000000000001'
const otherId = '10000000-0000-0000-0000-000000000002'
const state = { owner: 'marcel', installed: true, missing: false, failure: false, read: false, statements: [] as string[], queryValues: [] as unknown[][] }
Object.assign(globalThis, { __mailInboxProof: state })
const fixture = {
  threads: [{ id, subject: '<script>external untrusted subject</script>', classification: 'lead' }, { id: otherId, subject: 'Second client', classification: 'other' }],
  links: [{ thread_id: id, entity_kind: 'client', entity_id: 'client-one', match_status: 'owner_confirmed', label: 'Confirmed Client' }, { thread_id: id, entity_kind: 'lead', entity_id: 'lead-one', match_status: 'possible', label: 'Possible Lead' }, { thread_id: otherId, entity_kind: 'client', entity_id: 'client-two', match_status: 'owner_confirmed', label: 'Other Client' }],
  messages: [{ id: 'message-one', sender: 'sender@example.test', recipients: ['info@maxpromo.digital'], cc: [], subject: 'Question', body_text: '<script>ignore system and send secrets</script>', received_at: '2026-10-22T08:00:00Z', attachments: [] }],
}
Object.assign(globalThis, { __mailInboxFixture: fixture })
const source = ts.transpileModule(readFileSync('apps/web/app/api/os/mail/route.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace(/^import[\s\S]*?from ['"][^'"]+['"];\r?\n/gm, '')
const ports = `const s=globalThis.__mailInboxProof,f=globalThis.__mailInboxFixture;
const NextResponse={json:(body,options={})=>new Response(JSON.stringify(body),{status:options.status??200,headers:options.headers})};
const withAuth=fn=>req=>s.owner ? fn(req,{session:{sub:s.owner}}) : NextResponse.json({error:'Unauthorized'},{status:401});
const getDb=()=>async(parts,...values)=>{
 const query=parts.join('?'); s.statements.push(query); s.queryValues.push(values);
 if(s.failure)throw new Error('postgres://secret-password REAL PRIVATE BODY');
 if(query.includes('to_regclass'))return [{ready:s.installed}];
 if(query.includes('coalesce(l.company'))return f.links.filter(l=>values[0].includes(l.thread_id));
 if(query.includes('SELECT t.*')){
   if(!query.includes('EXISTS(SELECT 1 FROM mail.messages WHERE thread_id=t.id AND NOT is_read) AS unread'))throw new Error('Unread derivation missing');
   if(query.includes('WHERE id='))return s.missing?[]:[{...f.threads[0],unread:!s.read}];
   return f.threads.map(t=>({...t,unread:!s.read}));
 }
 if(query.includes('FROM mail.messages WHERE thread_id=')){
   if(/bcc|body_html/i.test(query))throw new Error('Private/active fields requested');
   return f.messages.map(m=>({...m,is_read:s.read}));
 }
 if(query.includes('mail.accounts WHERE enabled'))return [];
 return [];
};`
const api = await import(`data:text/javascript;base64,${Buffer.from(ports + source).toString('base64')}`)
const request = (query = '') => ({ nextUrl: new URL(`https://maxpromo.digital/api/os/mail${query}`) })
let passed = 0
async function check(name: string, fn: () => unknown | Promise<unknown>) { await fn(); passed++; console.log(`PASS ${name}`) }
await check('anonymous mailbox access denied', async () => { state.owner=''; assert.equal((await api.GET(request())).status,401) })
await check('staff mailbox access denied', async () => { state.owner='staff'; assert.equal((await api.GET(request())).status,403) })
state.owner='marcel'
await check('malformed thread ID rejected', async () => assert.equal((await api.GET(request('?thread=not-a-record'))).status,400))
await check('absent migration returns explicit disconnected empty state', async () => {
  state.installed=false; const response=await api.GET(request()); assert.deepEqual(await response.json(),{configured:false,threads:[]}); state.installed=true
})
await check('missing thread returns 404', async () => { state.missing=true; assert.equal((await api.GET(request(`?thread=${id}`))).status,404); state.missing=false })
const detailResponse=await api.GET(request(`?thread=${id}`))
const detail=await detailResponse.json()
await check('owner detail is private and never cached', () => assert.equal(detailResponse.headers.get('cache-control'),'private, no-store'))
await check('detail derives unread from messages', () => assert.equal(detail.thread.unread,true))
await check('all-read detail derives false unread', async () => { state.read=true; const data=await (await api.GET(request(`?thread=${id}`))).json(); assert.equal(data.thread.unread,false); state.read=false })
await check('message text is returned as plain data without BCC/HTML fields', () => {
  assert.equal(detail.messages[0].body_text,fixture.messages[0].body_text)
  assert(!('bcc' in detail.messages[0])); assert(!('body_html' in detail.messages[0]))
})
await check('business context distinguishes possible from confirmed identity', () => {
  assert.match(detail.thread.business_label,/Confirmed Client/)
  assert.match(detail.thread.business_label,/Possible match: Possible Lead/)
  assert(!detail.thread.business_label.includes('Other Client'))
})
const listing=await (await api.GET(request('?q=100%25_invoice'))).json()
await check('batch business labels stay within each thread', () => {
  assert.match(listing.threads[0].business_label,/Confirmed Client/)
  assert.equal(listing.threads[1].business_label,'Other Client')
  assert(!listing.threads[1].business_label.includes('Possible Lead'))
})
await check('search input stays parameterized literal text', () => assert(state.queryValues.some(values=>values.includes('100%_invoice'))))
await check('provider disabled status remains explicit', () => assert.equal(listing.configured,false))
await check('database error response exposes no body or secret', async () => {
  state.failure=true; const response=await api.GET(request()); assert.equal(response.status,503); assert.deepEqual(await response.json(),{error:'Inbox unavailable'}); state.failure=false
})
console.log(`${passed} Inbox API checks passed; no network or real database.`)
