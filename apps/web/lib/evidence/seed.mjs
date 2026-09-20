#!/usr/bin/env node
/**
 * apps/web/lib/evidence/seed.mjs
 *
 * Populates the Maxpromo OS evidence environment with one fictional business.
 *
 *   MAXPROMO_EVIDENCE_MODE=1 EVIDENCE_DATABASE_URL=postgres://… \
 *     node apps/web/lib/evidence/seed.mjs          # seed
 *   … node apps/web/lib/evidence/seed.mjs --reset  # remove and re-seed
 *
 * WHAT MAKES THIS SAFE, IN ORDER OF HOW MUCH IT MATTERS
 *
 * 1. It cannot reach production. The connection string comes from
 *    EVIDENCE_DATABASE_URL and from nowhere else. If that variable is unset,
 *    or equal to either production variable, the run stops before connecting.
 *    There is no flag to override that and no fallback to `DATABASE_URL`.
 *
 * 2. It cannot read a production row. The data is imported from
 *    `dataset.ts`, which is constants. There is no SELECT anywhere in this
 *    file except against the evidence database, looking for rows this seed
 *    itself wrote.
 *
 * 3. It cannot delete anything it did not create. `--reset` deletes only rows
 *    whose document number begins with the evidence prefix. A row without that
 *    prefix is not touched, so pointing this at a populated database by
 *    accident still cannot destroy its contents.
 *
 * 4. It cannot send. Nothing here imports the mail or notification transport.
 *    The application-level block in `lib/email.ts` and `lib/telegram.ts` is the
 *    second line, for the case where a person clicks Send in the interface.
 *
 * 5. It is deterministic and idempotent. Same constants, same rows, no clock,
 *    no random. Running it twice is a no-op rather than a duplicate.
 */

import { neon } from '@neondatabase/serverless'
import { evidenceDbProblem, EVIDENCE_DB_ENV, EVIDENCE_DOC_PREFIX } from '../../../../packages/config/evidence.ts'
import {
  EVIDENCE_CLIENT, EVIDENCE_LINE_ITEMS, EVIDENCE_ANGEBOT,
  EVIDENCE_INVOICE, EVIDENCE_INVOICE_PAID,
} from './dataset.ts'

const RESET = process.argv.includes('--reset')

/* ── Gate one: the environment ───────────────────────────────────────────── */
const problem = evidenceDbProblem(process.env)
if (problem) {
  console.error('evidence seed: refusing to run.')
  console.error('  ' + problem)
  console.error('')
  console.error('  This seed only ever writes to a database named by ' + EVIDENCE_DB_ENV + ',')
  console.error('  and never to the production one. That is the whole safety property;')
  console.error('  there is no override.')
  process.exit(1)
}

const sql = neon(process.env[EVIDENCE_DB_ENV])

/** Owner id the OS uses for its single operator. Mirrors the API routes. */
const OWNER_ID = 1

async function main() {
  /* ── Gate two: prove the target is not production, from its contents ────
     The URL check above is necessary and not sufficient: two different URLs
     can point at the same database. So before writing anything, count the
     rows that do NOT carry the evidence prefix. A database holding real
     paperwork is not an evidence database, whatever it is called. */
  const [{ foreign }] = await sql`
    SELECT COUNT(*)::int AS foreign FROM os_invoices
    WHERE invoice_number NOT LIKE ${EVIDENCE_DOC_PREFIX + '%'}
  `
  if (foreign > 0) {
    console.error('evidence seed: refusing to run.')
    console.error(`  The target database holds ${foreign} invoice(s) that this seed did not write.`)
    console.error('  That is production data, or a copy of it. Point EVIDENCE_DATABASE_URL')
    console.error('  at an empty database.')
    process.exit(1)
  }

  if (RESET) {
    /* Only ever rows this seed wrote. The prefix is the authority. */
    const like = EVIDENCE_DOC_PREFIX + '%'
    await sql`DELETE FROM os_invoices WHERE invoice_number LIKE ${like}`
    await sql`DELETE FROM os_angebote WHERE angebot_number LIKE ${like}`
    await sql`DELETE FROM os_clients  WHERE email = ${EVIDENCE_CLIENT.email}`
    console.log('evidence seed: reset — evidence rows removed, nothing else touched')
  }

  /* ── The client ─────────────────────────────────────────────────────────
     Found or created by its fictional email, so a second run updates rather
     than duplicates. */
  const existing = await sql`SELECT id FROM os_clients WHERE email = ${EVIDENCE_CLIENT.email}`
  let clientId
  if (existing.length > 0) {
    clientId = existing[0].id
    console.log('evidence seed: client already present, id ' + clientId)
  } else {
    const rows = await sql`
      INSERT INTO os_clients (owner_id, name, company, email, phone, address, city, country, notes, status)
      VALUES (${OWNER_ID}, ${EVIDENCE_CLIENT.name}, ${EVIDENCE_CLIENT.company},
              ${EVIDENCE_CLIENT.email}, ${EVIDENCE_CLIENT.phone}, ${EVIDENCE_CLIENT.address},
              ${EVIDENCE_CLIENT.city}, ${EVIDENCE_CLIENT.country}, ${EVIDENCE_CLIENT.notes}, 'active')
      RETURNING id`
    clientId = rows[0].id
    console.log('evidence seed: client created, id ' + clientId)
  }

  /* ── The quotation, left in draft on purpose ────────────────────────────── */
  const a = EVIDENCE_ANGEBOT
  const haveAngebot = await sql`SELECT id FROM os_angebote WHERE angebot_number = ${a.angebot_number}`
  if (haveAngebot.length === 0) {
    await sql`
      INSERT INTO os_angebote
        (owner_id, angebot_number, client_id, client_name, client_email, client_address,
         line_items, subtotal, total, status, valid_until, notes,
         anzahlung, payment_method, currency, language)
      VALUES
        (${OWNER_ID}, ${a.angebot_number}, ${clientId}, ${EVIDENCE_CLIENT.company},
         ${EVIDENCE_CLIENT.email},
         ${`${EVIDENCE_CLIENT.address}, ${EVIDENCE_CLIENT.postcode} ${EVIDENCE_CLIENT.city}`},
         ${JSON.stringify(EVIDENCE_LINE_ITEMS)}::jsonb, ${a.subtotal}, ${a.total},
         ${a.status}, ${a.valid_until}, ${EVIDENCE_CLIENT.notes},
         0, 'bank', ${a.currency}, ${a.language})`
    console.log('evidence seed: quotation ' + a.angebot_number + ' created (draft)')
  } else {
    console.log('evidence seed: quotation ' + a.angebot_number + ' already present')
  }

  /* ── Two invoices, so a list view shows a lifecycle ─────────────────────── */
  for (const inv of [EVIDENCE_INVOICE, EVIDENCE_INVOICE_PAID]) {
    const have = await sql`SELECT id FROM os_invoices WHERE invoice_number = ${inv.invoice_number}`
    if (have.length > 0) {
      console.log('evidence seed: invoice ' + inv.invoice_number + ' already present')
      continue
    }
    await sql`
      INSERT INTO os_invoices
        (owner_id, invoice_number, client_id, client_name, client_email, client_address,
         line_items, subtotal, total, status, due_date, notes, currency, language)
      VALUES
        (${OWNER_ID}, ${inv.invoice_number}, ${clientId}, ${EVIDENCE_CLIENT.company},
         ${EVIDENCE_CLIENT.email},
         ${`${EVIDENCE_CLIENT.address}, ${EVIDENCE_CLIENT.postcode} ${EVIDENCE_CLIENT.city}`},
         ${JSON.stringify(inv.line_items)}::jsonb, ${inv.subtotal}, ${inv.total},
         ${inv.status}, ${inv.due_date}, ${EVIDENCE_CLIENT.notes},
         ${inv.currency}, ${inv.language})`
    console.log('evidence seed: invoice ' + inv.invoice_number + ' created (' + inv.status + ')')
  }

  const [{ n }] = await sql`
    SELECT COUNT(*)::int AS n FROM os_invoices WHERE invoice_number LIKE ${EVIDENCE_DOC_PREFIX + '%'}
  `
  console.log('')
  console.log('evidence seed: done. ' + n + ' evidence invoice(s), 1 quotation, 1 client.')
  console.log('Every record is marked ' + EVIDENCE_DOC_PREFIX + ' and belongs to a fictional business.')
}

main().catch((e) => {
  console.error('evidence seed: failed —', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
