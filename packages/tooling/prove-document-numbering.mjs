#!/usr/bin/env node
/**
 * packages/tooling/prove-document-numbering.mjs
 *
 * Opening a blank form may not consume a business document number, and the
 * browser may not choose the number a document is stored under. For both
 * numbered families: quotations and invoices.
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
 * AND THE INVOICE SERIES, 2026-10-05 (risk 63)
 *
 * The invoice route had never been given either fix. Its preview called the
 * allocator, so every blank invoice form consumed a number — the 26 September
 * defect, on the series the comment above worries about — and its save stored
 * whatever number the browser sent back. Both families now follow one rule,
 * and this gate proves it for each.
 *
 * THE RULE
 *
 * Reading is a preview and consumes nothing. Saving allocates, exactly once,
 * and never takes the number from the request. The preview predicts what the
 * allocator will issue, from the state the allocator reads, so the number on
 * the form is the number on the record unless another save intervenes.
 *
 * WHY THIS GATE NEEDS A DATABASE
 *
 * The property is about a sequence, and a sequence is a database object. There
 * is no honest way to assert this against source alone — the previous
 * behaviour was one function call away from correct and read perfectly well.
 * So it runs against the evidence lab when one is configured, and says plainly
 * that it proved nothing when one is not. In the lab it restores every
 * sequence to its exact recorded state and creates no document.
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
const read = (...p) => stripComments(readFileSync(join(ROOT, ...p), 'utf8'))

/* One row per numbered family. Everything below runs once per row. */
const FAMILIES = [
  {
    key: 'angebot', label: 'quotation', prefix: 'ANG', table: 'os_angebote', column: 'angebot_number',
    route: ['apps', 'web', 'app', 'api', 'os', 'angebote', 'route.ts'],
    form: ['apps', 'web', 'app', 'os', '(protected)', 'angebote', 'new', 'page.tsx'],
    preview: 'previewAngebotNumber', allocate: 'nextAngebotNumber', predict: 'predictNextAngebotNumber',
    sqlAllocator: 'next_angebot_number',
  },
  {
    key: 'invoice', label: 'invoice', prefix: 'MP', table: 'os_invoices', column: 'invoice_number',
    route: ['apps', 'web', 'app', 'api', 'os', 'invoices', 'route.ts'],
    form: ['apps', 'web', 'app', 'os', '(protected)', 'invoices', 'new', 'page.tsx'],
    preview: 'previewInvoiceNumber', allocate: 'nextInvoiceNumber', predict: 'predictNextInvoiceNumber',
    sqlAllocator: 'next_invoice_number',
  },
]

console.log('='.repeat(74))
console.log('DOCUMENT NUMBERING')

/* ── Source layer: runs everywhere, including CI with no database ─────────── */
for (const f of FAMILIES) {
  console.log('')
  console.log(`The ${f.label} route previews without consuming and allocates without trusting`)
  const src = read(...f.route)
  const getBlock = src.slice(src.indexOf('export async function GET'), src.indexOf('export async function POST'))
  const allocCall = new RegExp(`${f.allocate}\\s*\\(`)
  check('the GET handler never calls the consuming allocator', !allocCall.test(getBlock),
    allocCall.test(getBlock) ? `GET calls ${f.allocate}()` : '')
  check('the GET handler answers with a preview', new RegExp(`${f.preview}\\s*\\(`).test(getBlock))

  const i = src.indexOf(`async function ${f.preview}`)
  /* The preview's own body: up to the next function, whichever comes next. */
  const previewBody = i === -1 ? '' : src.slice(i, src.indexOf('async function', i + 1))
  check('the preview never advances or sets a sequence',
    previewBody !== '' && !new RegExp(`nextval|setval|SELECT\\s+${f.sqlAllocator}\\s*\\(`, 'i').test(previewBody))
  check('the preview reads the sequence the allocator advances, not stored rows',
    /pg_sequences/.test(previewBody) && new RegExp(`${f.predict}\\s*\\(`).test(previewBody)
      && !new RegExp(`ORDER BY ${f.column} DESC`, 'i').test(previewBody))

  const postBlock = src.slice(src.indexOf('export async function POST'), src.indexOf('export async function DELETE'))
  check('the save allocates on the server, exactly once',
    new RegExp(`const ${f.column} = await ${f.allocate}\\(\\)`).test(postBlock)
      && (postBlock.match(allocCall) ?? []).length === 1)
  /* Any read of the number off the request, however it is spelled: a direct
     property read, a cast, or a fallback `x.number || allocate()`. */
  const fromRequest = new RegExp(`body\\.${f.column}|\\.${f.column}\\s*(\\|\\||\\?\\?)|\\{[^}]*\\b${f.column}\\b[^}]*\\}\\s*=\\s*body`)
  check('the save never takes the number from the request',
    !fromRequest.test(postBlock),
    fromRequest.test(postBlock) ? `POST reads ${f.column} from the request` : '')
}

{
  console.log('')
  console.log('The invoice screens use the number the server issued')
  const form = read('apps', 'web', 'app', 'os', '(protected)', 'invoices', 'new', 'page.tsx')
  const save = form.slice(form.indexOf('async function saveInvoice'), form.indexOf('async function handleSaveDraft'))
  check('the new-invoice form does not send a number to be stored', save !== '' && !/invoice_number:\s*invoiceNumber/.test(save))
  check('the form takes the allocated number from the save response', /setInvoiceNumber\(data\.invoice_number\)/.test(save))
  const send = read('apps', 'web', 'app', 'api', 'os', 'send-invoice', 'route.ts')
  check('the invoice email carries the stored number, not the request\'s',
    /SELECT invoice_number, language FROM os_invoices/.test(send) && !/body\.invoice_number/.test(send))
}

/* ── Prediction layer: pure, runs everywhere ──────────────────────────────── */
const numbering = await import(pathToFileURL(join(ROOT, 'apps', 'web', 'lib', 'documents', 'numbering.ts')).href)
const seqAt = (lastValue) => ({ lastValue, startValue: 1, incrementBy: 1 })
for (const f of FAMILIES) {
  console.log('')
  console.log(`The ${f.label} preview predicts what the allocator will issue`)
  const predict = numbering[f.predict]
  const p = (state) => predict({ year: 2026, ...state })
  {
    /* The evidence run's shape: sequence at 14, no rows of this family stored. */
    const got = p({ hasAllocator: true, sequence: seqAt(14), maxStoredSuffix: null })
    check(`sequence at 14 with no stored rows predicts ${f.prefix}-2026-015, not 001`, got === `${f.prefix}-2026-015`, got)
  }
  {
    const got = p({ hasAllocator: true, sequence: seqAt(15), maxStoredSuffix: 3 })
    check('a sequence ahead of the rows wins over the rows', got === `${f.prefix}-2026-016`, got)
  }
  {
    const got = p({ hasAllocator: true, sequence: seqAt(null), maxStoredSuffix: null })
    check('a created but unused sequence predicts its start value', got === `${f.prefix}-2026-001`, got)
  }
  {
    const got = predict({ year: 2027, hasAllocator: true, sequence: null, maxStoredSuffix: 9 })
    check('a year with no sequence yet predicts 001, as the function creates it', got === `${f.prefix}-2027-001`, got)
  }
  {
    const got = p({ hasAllocator: false, sequence: null, maxStoredSuffix: 9 })
    check('without the allocator function the route falls back to rows, and so does the preview', got === `${f.prefix}-2026-010`, got)
  }
}

/* ── Behaviour layer: against the evidence lab, when there is one ─────────── */
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
  /* Evidence lab only. This gate writes to sequences, and it may do that
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
  try {
    for (const f of FAMILIES) {
      console.log('')
      console.log(`The ${f.label} sequence does not move when nothing is saved`)
      const seq = `doc_seq.${f.key}_${year}`
      const state = async () => {
        const r = await pool.query(`SELECT last_value, is_called FROM ${seq}`).catch(() => null)
        return r?.rows?.[0] ?? null
      }
      const peek = async () => {
        const s = await state()
        return s ? `${s.last_value}/${s.is_called}` : 'absent'
      }
      const rowCount = async () => (await pool.query(`SELECT COUNT(*)::int AS n FROM ${f.table}`)).rows[0].n
      /* The same state the route's preview reads, through the same prediction. */
      const predict = async () => {
        const r = await pool.query(`
          WITH y AS (SELECT $1::int AS year)
          SELECT y.year,
            to_regprocedure('${f.sqlAllocator}(integer)') IS NOT NULL AS has_allocator,
            s.sequencename IS NOT NULL AS has_sequence,
            s.last_value::bigint AS last_value, s.start_value::bigint AS start_value,
            s.increment_by::bigint AS increment_by,
            (SELECT max(split_part(${f.column}, '-', 3)::int) FROM ${f.table}
              WHERE ${f.column} ~ ('^${f.prefix}-' || y.year || '-[0-9]+$')) AS max_suffix
          FROM y LEFT JOIN pg_sequences s
            ON s.schemaname = 'doc_seq' AND s.sequencename = '${f.key}_' || y.year`, [year])
        const row = r.rows[0]
        return numbering[f.predict]({
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
      const rowsBefore = await rowCount()
      try {
        const before = await peek()
        const previews = []
        for (let i = 0; i < 3; i++) previews.push(await predict())
        const after = await peek()
        check('three preview reads leave the sequence untouched', before === after, `${before} -> ${after}`)
        check('three preview reads return the same number', new Set(previews).size === 1, previews.join(' -> '))

        /* The number shown is the number issued. */
        const a = await pool.query(`SELECT ${f.sqlAllocator}() AS n`)
        check('the previewed number is the number the save allocates', a.rows[0]?.n === previews[0],
          `preview ${previews[0]}, allocated ${a.rows[0]?.n}`)
        const b = await pool.query(`SELECT ${f.sqlAllocator}() AS n`)
        check('the allocator still issues consecutive numbers',
          Boolean(a.rows[0]?.n && b.rows[0]?.n && a.rows[0].n !== b.rows[0].n),
          `${a.rows[0]?.n} then ${b.rows[0]?.n}`)
      } finally {
        /* Leave the lab exactly as found: the allocations above are this gate's
           own doing and must not become a permanent gap. */
        if (original) {
          await pool.query(`SELECT setval('${seq}', $1::bigint, $2::boolean)`,
            [original.last_value, original.is_called]).catch(() => {})
        } else {
          await pool.query(`DROP SEQUENCE IF EXISTS ${seq}`).catch(() => {})
        }
      }
      const restored = await peek()
      const rowsAfter = await rowCount()
      check('the lab is left exactly as found — sequence and rows',
        restored === (original ? `${original.last_value}/${original.is_called}` : 'absent') && rowsAfter === rowsBefore,
        `sequence ${restored}, ${f.table} ${rowsBefore} -> ${rowsAfter} rows`)
    }
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
  console.log('A document number is allocated by the server when a document is saved —')
  console.log('never when a blank form is opened, and never taken from the browser. Gaps')
  console.log('and duplicates in a numbered business series are what an auditor asks about.')
  process.exitCode = 1
}
