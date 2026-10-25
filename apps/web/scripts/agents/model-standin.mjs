/**
 * Proof tooling for ADR-0030 — never shipped, never pointed at production.
 *
 * A local stand-in between the Agent Bureau and Maxpromo OS for evidence runs where no working model
 * key exists on the machine. Every request is forwarded to the OS byte for byte (the signature covers
 * method, path and body, so the OS still verifies it), except the model door
 * (`POST /api/os/agent/v1/model`), which it answers itself with a deterministic, recorded-style answer:
 * evidence items whose quotes are copied verbatim from the page text it was sent. The OS gateway code
 * itself is proven against the real provider in production.
 *
 *   node apps/web/scripts/agents/model-standin.mjs [port=3031] [os=http://localhost:3020]
 *   GET /__mode?m=ok|slow|fail|invented   switches what the model step answers (local only; slow waits 20 s)
 */
import { createServer } from 'node:http'

const PORT = Number(process.argv[2] ?? 3031)
const OS = process.argv[3] ?? 'http://localhost:3020'
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(OS)) { console.error('model-standin: the OS target must be local'); process.exit(2) }
let mode = 'ok'
const calls = { model: 0, forwarded: 0 }

/** A research answer built only from the pages it was given. `invented` adds a claim that is on no page. */
function answer(content) {
  const pages = [...content.matchAll(/<page n="\d+" url="([^"]+)" title="[^"]*">\n([\s\S]*?)\n<\/page>/g)].map(m => ({ url: m[1], text: m[2] }))
  const evidence = []
  for (const p of pages) {
    for (const line of p.text.split('\n').map(l => l.trim()).filter(l => l.length >= 30 && l.length <= 180)) {
      if (evidence.length >= 3) break
      evidence.push({ kind: 'fact', text: `The site says: ${line.slice(0, 120)}`, quote: line, url: p.url })
    }
  }
  if (mode === 'invented') evidence.push({ kind: 'pain_point', text: 'Bookings only by fax', quote: 'Termine nur per Fax und Telefon, kein Online-Formular', url: pages[0]?.url ?? '' })
  return {
    summary: 'A business described by its own website (evidence stand-in).', business_type: 'Beratung', city: null,
    services: ['Beratung'], evidence, angle: { solution: 'workflow-automation', why: 'Stand-in angle grounded in the quoted pages.' },
    contact_person: null, contact_role: null, language: 'de',
  }
}

createServer(async (req, res) => {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const body = Buffer.concat(chunks)
  if (req.url?.startsWith('/__mode')) {
    mode = new URL(req.url, 'http://x').searchParams.get('m') ?? 'ok'
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ mode, calls }))
    return
  }
  if (req.method === 'POST' && req.url === '/api/os/agent/v1/model') {
    calls.model++
    if (mode === 'slow') await new Promise(r => setTimeout(r, 20_000))
    const parsed = JSON.parse(body.toString('utf8') || '{}')
    const out = mode === 'fail'
      ? { status: 'failed', task: parsed.task, klass: 'PROVIDER', latencyMs: 5 }
      : { status: 'done', task: parsed.task, data: answer(String(parsed.content ?? '')), model: 'evidence-standin', latencyMs: 5 }
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(out))
    return
  }
  calls.forwarded++
  const headers = { ...req.headers }
  delete headers.host; delete headers['content-length']; delete headers.connection
  try {
    const r = await fetch(`${OS}${req.url}`, { method: req.method, headers, body: req.method === 'GET' ? undefined : body, redirect: 'manual' })
    const out = Buffer.from(await r.arrayBuffer())
    res.writeHead(r.status, { 'content-type': r.headers.get('content-type') ?? 'application/json' }).end(out)
  } catch {
    res.writeHead(502).end('{"error":"os unreachable"}')
  }
}).listen(PORT, '127.0.0.1', () => console.log(`model-standin on :${PORT} → ${OS}`))
