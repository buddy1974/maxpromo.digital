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
 * THEN, 2026-10-04
 *
 * The fix held — three blank loads, no number consumed — and the first genuine
 * save still surprised everyone: the form showed ANG-2026-001 and the record
 * was saved as ANG-2026-015. The preview was computed from stored rows; the
 * save allocates from the sequence. In the evidence lab there were no ANG rows
 * and the sequence stood at 14, because of the very defect above. 015 was
 * right. The preview was reading the wrong thing.
 *
 * THE RULE
 *
 * Reading is a preview and consumes nothing. Saving allocates, exactly once.
 * A document number starts existing when the document does. And the preview
 * predicts what the allocator will issue, from the state the allocator reads,
 * so the number on the form is the number on the record unless another save
 * intervenes.
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
const previewBody = (() => {
  const i = routeSrc.indexOf('async function previewAngebotNumber')
  return i === -1 ? '' : routeSrc.slice(i, routeSrc.indexOf('async function nextAngebotNumber'))
})()
check(
  'the preview never advances or sets a sequence',
  previewBody !== '' && !/nextval|setval|SELECT\s+next_angebot_number\s*\(/i.test(previewBody),
)
check(
  'the preview reads the sequence the allocator advances, not stored rows',
  /pg_sequences/.test(previewBody) && /predictNextAngebotNumber\s*\(/.test(previewBody)
    && !/ORDER BY angebot_number DESC/i.test(previewBody),
  /ORDER BY angebot_number DESC/i.test(previewBody) ? 'preview still takes the highest stored row' : '',
)

const postBlock = routeSrc.slice(routeSrc.indexOf('export async function POST'))
check(
  'the save path allocates rather than trusting the client',
  /const angebot_number = await nextAngebotNumber\(\)/.test(postBlock),
  /body\.angebot_number \|\|/.test(postBlock) ? 'POST still accepts a client-supplied number' : '',
)

/* Prediction layer: pure, runs everywhere. */
console.log('')
console.log('The preview predicts what the allocator will issue')
const { predictNextAngebotNumber } = await import(
  pathToFileURL(join(ROOT, 'apps', 'web', 'lib', 'documents', 'numbering.ts')).href
)
const seqAt = (lastValue) => ({ lastValue, startValue: 1, incrementBy: 1 })
{
  /* The evidence run, exactly: sequence at 14, no ANG rows stored. */
  const got = predictNextAngebotNumber({ year: 2026, hasAllocator: true, sequence: seqAt(14), maxStoredSuffix: null })
  check('sequence at 14 with no stored rows predicts ANG-2026-015, not 001', got === 'ANG-2026-015', got)
}
{
  const got = predictNextAngebotNumber({ year: 2026, hasAllocator: true, sequence: seqAt(15), maxStoredSuffix: 3 })
  check('a sequence ahead of the rows wins over the rows', got === 'ANG-2026-016', got)
}
{
  const got = predictNextAngebotNumber({ year: 2026, hasAllocator: true, sequence: seqAt(null), maxStoredSuffix: null })
  check('a created but unused sequence predicts its start value', got === 'ANG-2026-001', got)
}
{
  const got = predictNextAngebotNumber({ year: 2027, hasAllocator: true, sequence: null, maxStoredSuffix: 9 })
  check('a year with no sequence yet predicts 001, as the function creates it', got === 'ANG-2027-001', got)
}
{
  const got = predictNextAngebotNumber({ year: 2026, hasAllocator: false, sequence: null, maxStoredSuffix: 9 })
  check('without the allocator function the route falls back to rows, and so does the preview', got === 'ANG-2026-010', got)
}

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
  const state = async () => {
    const r = await pool.query(`SELECT last_value, is_called FROM ${seq}`).catch(() => null)
    return r?.rows?.[0] ?? null
  }
  const peek = async () => {
    const s = await state()
    return s ? `${s.last_value}/${s.is_called}` : 'absent'
  }
  /* The same state the route's preview reads, through the same prediction. */
  const predict = async () => {
    const r = await pool.query(`
      WITH y AS (SELECT $1::int AS year)
      SELECT y.year,
        to_regprocedure('next_angebot_number(integer)') IS NOT NULL AS has_allocator,
        s.sequencename IS NOT NULL AS has_sequence,
        s.last_value::bigint AS last_value, s.start_value::bigint AS start_value,
        s.increment_by::bigint AS increment_by,
        (SELECT max(split_part(angebot_number, '-', 3)::int) FROM os_angebote
          WHERE angebot_number ~ ('^ANG-' || y.year || '-[0-9]+$')) AS max_suffix
      FROM y LEFT JOIN pg_sequences s
        ON s.schemaname = 'doc_seq' AND s.sequencename = 'angebot_' || y.year`, [year])
    const row = r.rows[0]
    return predictNextAngebotNumber({
      year: Number(row.year),
      hasAllocator: row.has_allocator,
      sequence: row.has_sequence
        ? { lastValue: row.last_value === null ? null : Number(row.last_value),
            startValue: Number(row.start_value ?? 1), incrementBy: Number(row.increment_by ?? 1) }
        : null,
      maxStoredSuffix: row.max_suffix === null ? null : Number(row.max_suffix),
    })
  }

  const original = await state()
  try {
    const before = await peek()

    /* Three preview reads, the same thing the form does on mount. */
    const previews = []
    for (let i = 0; i < 3; i++) previews.push(await predict())
    const after = await peek()

    check('three preview reads leave the sequence untouched', before === after,
      `${before} -> ${after}`)
    check('three preview reads return the same number',
      new Set(previews).size === 1, previews.join(' -> '))

    /* The number shown is the number issued. This is the 001-vs-015 check. */
    const shown = previews[0]
    const a = await pool.query(`SELECT next_angebot_number() AS n`)
    check('the previewed number is the number the save allocates', a.rows[0]?.n === shown,
      `preview ${shown}, allocated ${a.rows[0]?.n}`)

    /* And the allocator must still work, or the fix broke saving. */
    const b = await pool.query(`SELECT next_angebot_number() AS n`)
    check('the allocator still issues consecutive numbers',
      Boolean(a.rows[0]?.n && b.rows[0]?.n && a.rows[0].n !== b.rows[0].n),
      `${a.rows[0]?.n} then ${b.rows[0]?.n}`)
  } finally {
    /* Leave the lab exactly as found: the allocations above are this gate's
       own doing and must not become a permanent gap. Restored to the recorded
       state, not to "two less", which was wrong for a sequence never used. */
    if (original) {
      await pool.query(`SELECT setval('${seq}', $1::bigint, $2::boolean)`,
        [original.last_value, original.is_called]).catch(() => {})
      console.log(`  note  sequence restored to ${original.last_value}/${original.is_called}`)
    } else {
      await pool.query(`DROP SEQUENCE IF EXISTS ${seq}`).catch(() => {})
      console.log('  note  sequence did not exist before this gate; removed again')
    }
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
