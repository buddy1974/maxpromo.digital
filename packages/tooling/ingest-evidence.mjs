#!/usr/bin/env node
/**
 * packages/tooling/ingest-evidence.mjs
 *
 * The one way a capture enters `docs/evidence/maxpromo-os/`.
 *
 * WHY A TOOL AND NOT A HABIT
 *
 * The capture manifest has said since 2026-09-24 that a capture is ingested
 * only when someone names it explicitly, never "the newest file" — the rule
 * was written after the owner's Screenshots folder turned out to hold an order
 * confirmation with his home address. It was a rule a person had to remember.
 * Two governed browser runs since then produced five frames, and none reached
 * the repository, partly because there was no defined path for them to take.
 *
 * This is that path, and it enforces the manifest rather than restating it:
 *
 *   - the source is an explicitly named file, either in the gitignored inbox
 *     beside this evidence, or a path a capture tool reported writing under
 *     the system temp directory. Never a personal folder: Pictures,
 *     Screenshots, Downloads, Desktop, Documents roots and OneDrive are
 *     refused by name, whatever the file is called.
 *   - the requirement must exist in the manifest, which fixes the filename;
 *     the operator does not choose it.
 *   - the file must be a PNG or a JPEG, identified by its bytes, never by its
 *     name. It is copied byte for byte and keeps its own format: the manifest
 *     fixes the name (`01-source-note`), the bytes decide the extension. A
 *     capture tool that produced a JPEG produced a JPEG; renaming it .png would
 *     misdescribe it, and converting it would make the stored file something
 *     the browser never produced. Its SHA-256, format, size and dimensions are
 *     recorded in LEDGER.json, so a file later swapped on disk no longer
 *     matches its entry and `check:proof` fails.
 *   - nothing is overwritten without --replace.
 *
 * Ingesting is not inspecting. A second command records the inspection, and
 * it requires the marker the inspector actually saw in the image — one of the
 * governed markers the manifest's positive test lists. `check:proof` accepts
 * an evidence artefact as satisfying a requirement only with both.
 *
 *   npm run evidence:ingest -- --requirement os-source-note \
 *       --from docs/evidence/maxpromo-os/inbox/01-source-note.png \
 *       --captured 2026-10-05 --by "Chrome, governed run"
 *   npm run evidence:ingest -- --record-inspection os-source-note \
 *       --saw "Beckmann Elektrotechnik GmbH" --by "VS Claude"
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'
import { join, resolve, relative, basename, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'

const ROOT = process.cwd()
const DIR = join(ROOT, 'docs', 'evidence', 'maxpromo-os')
const INBOX = join(DIR, 'inbox')
const MANIFEST = join(DIR, 'CAPTURE-MANIFEST.md')
const LEDGER = join(DIR, 'LEDGER.json')

/* The manifest's positive test: at least one of these must be visible. */
export const GOVERNED_MARKERS = [
  'EVD-2026-', 'Beckmann Elektrotechnik GmbH', 'Katrin Beckmann', 'Musterhausen', '.example',
]

/*
 * Or a verbatim line of the governed source note.
 *
 * The input frame (`os-source-note`) shows the enquiry as pasted, and the
 * textarea can show the order lines or the signature but not both at once.
 * The order lines — "Schaltschrank-Umbau Halle 2, pauschal 2.400,00" — were
 * written for apps/web/lib/evidence/dataset.ts and exist nowhere else, so they
 * identify the evidence environment as surely as the client's name does. Read
 * from the dataset, not restated here, and only lines long enough to be
 * distinctive count.
 */
export function sourceNoteLines() {
  const dataset = readFileSync(join(ROOT, 'apps', 'web', 'lib', 'evidence', 'dataset.ts'), 'utf8')
  const note = dataset.match(/EVIDENCE_SOURCE_NOTE = `([\s\S]*?)`/)?.[1] ?? ''
  return note.split(/\r?\n/).map((l) => l.replace(/^-\s*/, '').trim()).filter((l) => l.length >= 30)
}

const PERSONAL =/[\\/](Pictures|Bilder|Screenshots|Downloads|Desktop|OneDrive[^\\/]*)([\\/]|$)/i

const fail = (msg) => { console.error('evidence:ingest: ' + msg); process.exit(1) }

function arg(name) {
  const i = process.argv.indexOf(name)
  return i === -1 ? undefined : process.argv[i + 1]
}

/** Requirement id → filename, read from the manifest's own headings. */
export function manifestCaptures(text = readFileSync(MANIFEST, 'utf8')) {
  const out = {}
  for (const m of text.matchAll(/^### \d+ · `([a-z0-9-]+)` → `([a-z0-9-]+\.png)`/gm)) out[m[1]] = m[2]
  return out
}

export function readLedger() {
  return existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : []
}

function writeLedger(entries) {
  writeFileSync(LEDGER, JSON.stringify(entries, null, 2) + '\n')
}

export function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/** Format and dimensions, read from the bytes. Null for anything else. */
export function imageInfo(buf) {
  if (buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
    return { format: 'png', ext: '.png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    /* Walk the segments to the first start-of-frame, which carries the size. */
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return null
      const marker = buf[i + 1]
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
      const len = buf.readUInt16BE(i + 2)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { format: 'jpeg', ext: '.jpg', height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
      }
      i += 2 + len
    }
  }
  return null
}

const today = () => new Date().toISOString().slice(0, 10)

function ingest() {
  const requirement = arg('--requirement')
  const from = arg('--from')
  const captured = arg('--captured')
  const by = arg('--by')
  if (!requirement || !from || !captured || !by) {
    fail('need --requirement, --from, --captured YYYY-MM-DD and --by')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(captured)) fail('--captured must be YYYY-MM-DD')

  const captures = manifestCaptures()
  const named = captures[requirement]
  if (!named) fail(`"${requirement}" is not a capture in CAPTURE-MANIFEST.md`)

  const src = resolve(ROOT, from)
  if (PERSONAL.test(src)) {
    fail('refusing a personal folder. Captures come from the inbox or a path a capture tool reported, never from Pictures, Screenshots, Downloads, Desktop or OneDrive.')
  }
  const inInbox = src.startsWith(INBOX + sep)
  const inTemp = src.startsWith(resolve(tmpdir()) + sep)
  if (!inInbox && !inTemp) {
    fail(`the source must be in ${relative(ROOT, INBOX)} or under the system temp directory a capture tool writes to`)
  }
  if (!existsSync(src)) fail(`no such file: ${from}`)

  const buf = readFileSync(src)
  const size = imageInfo(buf)
  if (!size) fail('neither a PNG nor a JPEG, judged by its bytes')
  /* The manifest fixes the name; the bytes fix the extension. */
  const file = named.replace(/\.png$/, size.ext)

  const dest = join(DIR, file)
  if (existsSync(dest) && !process.argv.includes('--replace')) {
    fail(`${relative(ROOT, dest)} already exists. Pass --replace to supersede it; the ledger keeps the old entry.`)
  }
  mkdirSync(DIR, { recursive: true })
  copyFileSync(src, dest)

  const ledger = readLedger()
  for (const e of ledger) if (e.requirement === requirement && !e.supersededOn) e.supersededOn = today()
  ledger.push({
    requirement,
    file: relative(ROOT, dest).split(sep).join('/'),
    sha256: sha256(dest),
    format: size.format,
    bytes: buf.length,
    width: size.width,
    height: size.height,
    /* The basename only: a full path can carry a user name. */
    source: { route: inInbox ? 'inbox' : 'tool-temp', name: basename(src) },
    capturedOn: captured,
    capturedBy: by,
    ingestedOn: today(),
    inspection: null,
  })
  writeLedger(ledger)
  console.log(`evidence:ingest: ${requirement} -> ${relative(ROOT, dest)} (${size.width}×${size.height}, sha256 ${sha256(dest).slice(0, 12)}…)`)
  console.log('Not yet inspected. Look at the image, then record what you saw with --record-inspection.')
}

function recordInspection() {
  const requirement = arg('--record-inspection')
  const saw = arg('--saw')
  const by = arg('--by')
  if (!saw || !by) fail('need --saw "<governed marker seen in the image>" and --by')
  const marker = GOVERNED_MARKERS.find((m) => saw.includes(m))
  const sourceLine = sourceNoteLines().find((l) => saw.includes(l))
  if (!marker && !sourceLine) {
    fail(`--saw must contain a governed marker (${GOVERNED_MARKERS.join(' | ')}) or a verbatim line of EVIDENCE_SOURCE_NOTE. An image showing none is not verifiably from the evidence environment.`)
  }
  const ledger = readLedger()
  const entry = ledger.find((e) => e.requirement === requirement && !e.supersededOn)
  if (!entry) fail(`no current ledger entry for ${requirement}`)
  if (sha256(join(ROOT, entry.file)) !== entry.sha256) fail(`${entry.file} no longer matches its ledger hash`)
  entry.inspection = {
    on: today(), by, saw,
    basis: marker ? `governed marker: ${marker}` : `governed source-note line: ${sourceLine}`,
    checked: 'no real identity, credential, production data, terminal, devtools, notification or error overlay',
    ...(arg('--note') ? { note: arg('--note') } : {}),
  }
  writeLedger(ledger)
  console.log(`evidence:ingest: inspection recorded for ${requirement}. The requirement may now move to satisfiedBy in proof.ts.`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))) {
  if (process.argv.includes('--record-inspection')) recordInspection()
  else ingest()
}
