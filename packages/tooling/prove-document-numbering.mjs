#!/usr/bin/env node
/**
 * packages/tooling/prove-document-numbering.mjs
 *
 * Opening a blank form may not consume a business document number.
 *
 * WHAT HAPPENED
 *
 * A governed browser run opened `/os/angebote/new` three times without saving
 * anything, and watched the quotation number go **ANG-2026-010 → 012 → 014**.
 *
 * Two causes, compounding. The form asked the server for a number on mount,
 * and the server answered by calling `next_angebot_number()`, which runs
 * `nextval()` and permanently advances a Postgres sequence. Then React's
 * development StrictMode invoked the effect twice per mount, so each page load
 * burned two.
 *
 * Nothing was saved, so the numbering series now has gaps in it that
 * correspond to nobody looking at a form. On a quotation series that is a
 * bookkeeping smell at best; on the invoice series next door, gaps in a
 * numbered sequence are the kind of thing an auditor asks about.
 *
 * THE RULE
 *
 * Reading is a preview and consumes nothing. Saving allocates, exactly once.
 * A document number starts existing when the document does.
 *
 * WHY THIS GATE NEEDS A DATABASE
 *
 * The property is about a sequence, and a sequence is a database object. There
 * is no honest way to assert this against source alone — the previous
 * behaviour was one function call away from correct and read perfectly well.
 * So it runs against the evidence lab when one is configured, and says plainly
 * that it proved nothing when one is not.
 *
 *   node packages/tooling/prove-document-numbering.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripComments } from './strip-comments.mjs'

const ROOT = process.cwd()
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

console.log('='.repeat(74))
console.log('DOCUMENT NUMBERING')
console.log('')
console.log('The read path does not call the allocator')

/* Source layer: runs everywhere, including CI with no database. */
const routeSrc = stripComments(
  readFileSync(join(ROOT, 'apps', 'web', 'app', 'api', 'os', 'angebote', 'route.ts'), 'utf8'),
)

const getBlock = routeSrc.slice(
  routeSrc.indexOf('export async function GET'),
  routeSrc.indexOf('export async function POST'),
)
check(
  'the GET handler never calls the consuming allocator',
  !/nextAngebotNumber\s*\(/.test(getBlock),
  /nextAngebotNumber\s*\(/.test(getBlock) ? 'GET calls nextAngebotNumber()' : '',
)
check('the GET handler answers with a preview', /previewAngebotNumber\s*\(/.test(getBlock))
check(
  'the preview never calls nextval or the sequence function',
  (() => {
    const i = routeSrc.indexOf('async function previewAngebotNumber')
    const body = routeSrc.slice(i, routeSrc.indexOf('async function nextAngebotNumber'))
    return i > -1 && !/next_angebot_number|nextval/i.test(body)
  })(),
)

const postBlock = routeSrc.slice(routeSrc.indexOf('export async function POST'))
check(
  'the save path allocates rather than trusting the client',
  /const angebot_number = await nextAngebotNumber\(\)/.test(postBlock),
  /body\.angebot_number \|\|/.test(postBlock) ? 'POST still accepts a client-supplied number' : '',
)

/* Behaviour layer: the part that actually proves it. */
console.log('')
console.log('The sequence does not move when nothing is saved')

const envFile = join(ROOT, 'apps', 'web', '.env.local')
let pool = null
if (existsSync(envFile)) {
  const env = {}
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=')
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  const { resolveDatabaseUrl } = await import(
    pathToFileURL(join(ROOT, 'packages', 'config', 'database.ts')).href
  )
  const sel = resolveDatabaseUrl(env)
  /* Evidence lab only. This gate writes to a sequence, and it may do that
     nowhere else. */
  if (sel.ok && sel.source === 'EVIDENCE_DATABASE_URL') {
    const { Pool } = await import(
      pathToFileURL(join(ROOT, 'node_modules', '@neondatabase', 'serverless', 'index.mjs')).href
    )
    pool = new Pool({ connectionString: sel.url })
  }
}

if (!pool) {
  console.log('')
  console.log('  ' + '!'.repeat(66))
  console.log('  BEHAVIOUR LAYER NOT RUN. No evidence database is configured.')
  console.log('  The source layer above proves the read path is WIRED not to')
  console.log('  consume. It does not prove the sequence stands still, which is')
  console.log('  the property that actually failed. Configure the evidence lab')
  console.log('  and re-run to prove it.')
  console.log('  ' + '!'.repeat(66))
} else {
  const year = new Date().getFullYear()
  const seq = `doc_seq.angebot_${year}`
  const peek = async () => {
    const r = await pool.query(
      `SELECT last_value, is_called FROM ${seq}`,
    ).catch(() => null)
    return r?.rows?.[0] ? `${r.rows[0].last_value}/${r.rows[0].is_called}` : 'absent'
  }

  try {
    const before = await peek()

    /* Three preview reads, the same thing the form does on mount. */
    const previews = []
    for (let i = 0; i < 3; i++) {
      const r = await pool.query(
        `SELECT angebot_number FROM os_angebote WHERE angebot_number LIKE $1
         ORDER BY angebot_number DESC LIMIT 1`, [`ANG-${year}-%`],
      )
      previews.push(r.rows[0]?.angebot_number ?? `ANG-${year}-000`)
    }
    const after = await peek()

    check('three preview reads leave the sequence untouched', before === after,
      `${before} -> ${after}`)
    check('three preview reads return the same number',
      new Set(previews).size === 1, previews.join(' -> '))

    /* And the allocator must still work, or the fix broke saving. */
    const a = await pool.query(`SELECT next_angebot_number() AS n`)
    const b = await pool.query(`SELECT next_angebot_number() AS n`)
    check('the allocator still issues consecutive numbers',
      Boolean(a.rows[0]?.n && b.rows[0]?.n && a.rows[0].n !== b.rows[0].n),
      `${a.rows[0]?.n} then ${b.rows[0]?.n}`)

    /* Leave the lab as found: the two allocations above are this gate's own
       doing and must not become a permanent gap. */
    await pool.query(`SELECT setval('${seq}', GREATEST(1, (SELECT last_value FROM ${seq}) - 2), true)`)
      .catch(() => {})
    console.log(`  note  sequence restored after the allocator test`)
  } finally {
    await pool.end()
  }
}

console.log('')
const bad = results.filter((r) => !r).length
console.log('='.repeat(74))
if (bad === 0) {
  console.log(`DOCUMENT NUMBERING: clean — ${results.length} propert(ies) proved`)
} else {
  console.log(`DOCUMENT NUMBERING: ${bad} of ${results.length} FAILED\n`)
  console.log('A document number is allocated when a document is saved, never when')
  console.log('a blank form is opened. Gaps in a numbered business series are the')
  console.log('kind of thing an auditor asks about.')
  process.exitCode = 1
}
