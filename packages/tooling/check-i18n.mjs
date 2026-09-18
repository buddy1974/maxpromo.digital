#!/usr/bin/env node
/**
 * packages/tooling/check-i18n.mjs
 *
 * Two supported languages means two complete languages.
 *
 * Agent Bureau shipped for months as a German product with English words
 * scattered through it — "Operating Model", "Audit Console", "Approval Desk"
 * inside German navigation — and no way to read it in English at all. The
 * repair is only worth as much as the thing that keeps it repaired, because
 * the way a bilingual product dies is one hurried key at a time.
 *
 * WHAT THIS PROVES, PER APPLICATION THAT DECLARES LOCALES
 *
 *   1. Every locale the Domain Registry says a host speaks has a message file.
 *   2. The key sets are identical. A key in one language and not the other is
 *      a screen that will be half-translated, and it fails here rather than in
 *      front of a customer.
 *   3. No value is empty, and no value is the bare key path.
 *   4. German and English are actually different where they should be. A value
 *      copied verbatim into both files is usually a forgotten translation; the
 *      ones that are legitimately identical (proper nouns, "CRM", "n8n") are
 *      listed by key, so an exemption is a decision somebody wrote down.
 *   5. No user-visible string was left hardcoded in the source. Heuristic by
 *      necessity — see SCAN below — and deliberately biased towards German,
 *      because a German sentence in a .tsx file is the specific failure this
 *      application had.
 *
 *   node packages/tooling/check-i18n.mjs
 *
 * Its own ability to fail is demonstrated by prove-i18n.mjs.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { stripComments } from './strip-comments.mjs'

const ROOT = process.cwd()

/**
 * Applications with their own message catalogue, and where their user-visible
 * source lives. Both applications are listed: the hub has had one since it was
 * built, and a check that only looked at the one being fixed would not notice
 * the other one drifting.
 */
const APPS = [
  {
    name: 'web',
    messages: 'apps/web/messages',
    /**
     * The hub's PAGES are not scanned for hardcoded strings. Its CHROME is.
     *
     * The pages say both languages with a conditional rather than a
     * catalogue — `isDE ? 'Leistungen' : 'Solutions'`, and the same choice
     * made once above a twenty-line array. That is complete coverage: the two
     * languages are two arms of one expression, and neither can ship without
     * the other. Scanning them produces 215 findings, every one of which is a
     * correctly translated page, and the only route to a green gate would be
     * an exemption list longer than the check itself. A gate nobody can read
     * is not a gate, so the pages keep the original decision.
     *
     * The chrome is a different case, and the note that used to stand here
     * was wrong about it. It said the hub's public surfaces "already read
     * every string from the catalogue". True of the pages; false of the
     * chrome wrapped around every one of them. The navigation shipped a
     * German-only accessible name on its close control, and the Max
     * conversation shipped its header, its close control and its send control
     * as English literals with no German. These components DO read from the
     * catalogue, so a literal in one of them is unambiguously a string that
     * was never translated — there is no pairing question to answer and
     * nothing to exempt.
     *
     * apps/web/app/os stays out, for the original and still-correct reason:
     * it is the internal back office — one operator, German, not a
     * supported-bilingual surface — and it contains German that is data
     * rather than interface (a unit of measure, a payment method, a city).
     */
    scan: [
      'apps/web/components/max',
      'apps/web/components/Navbar.tsx',
      'apps/web/components/Footer.tsx',
      'apps/web/components/CookieBanner.tsx',
      // The control that exists for readers of the other language announced
      // itself only in English: `aria-label={`Switch language to ${target}`}`.
      'apps/web/components/LocaleSwitcher.tsx',
    ],
    scanHardcoded: true,
    /**
     * Both languages are findings in the chrome.
     *
     * The platform heuristic is German-biased, because German text in a .tsx
     * file was the Agent Bureau regression. The hub's chrome had the mirror
     * image — an English product role and three English control labels on a
     * German-first site — and a German-only scan walks past every one of them.
     */
    scanEnglish: true,
  },
  {
    name: 'bureau',
    messages: 'apps/bureau/messages',
    scan: ['apps/bureau/app', 'apps/bureau/components', 'apps/bureau/lib'],
    scanHardcoded: true,
  },
]

const LOCALES = ['de', 'en']

/**
 * Values that are legitimately the same in both languages.
 *
 * Every entry is a proper noun, a product term the company uses in both
 * languages on purpose, or a mark. Adding to this list is how you say "this
 * one really is the same word", and having to add to it is the point.
 */
const SAME_IN_BOTH = new Set([
  // ── Brand, product and company names ──────────────────────────────────────
  'common.brandWordmark', 'bureau.chiefName', 'nav.maxpromo',
  'footer.companyHeading', 'footer.website', 'footer.impressum',
  // The trading name in the hub's footer, and the assistant's own name. Both
  // are in the catalogue rather than written into the component so that the
  // words around them could be translated; neither changes with the language.
  'footer.brand', 'max.name', 'max.maxSaid',
  // The homepage. "Information" is the same word in German and English and is
  // one of five flow labels whose four siblings do differ; the founder's name
  // is a person; and the Business Friction Check is a product name, which the
  // content constitution says is not translated.
  'home.hero.f2', 'home.founder.name', 'home.resource.name',
  'home.bureau.label', 'footer.agentBureau', 'demoRoom.brand',
  // ── Proper nouns, printed as they are ─────────────────────────────────────
  'integrations.calendar', 'integrations.forms',
  'contact.contactMethodWhatsApp',
  'caseStudies.cs1Tag', 'caseStudies.cs2Tag', 'caseStudies.cs3Tag',
  'systemMap.n1', 'systemMap.n2', 'systemMap.n3', 'systemMap.n5',
  'systemMap.n6', 'systemMap.n9',
  'pillars.p1Title', 'flow.f5Name',
  // ── Marks and affixes that carry no language ──────────────────────────────
  'contact.formOptional', 'contact.systemLabel', 'lead.name',
  'contact.painPoints.website',
  // ── Agent Bureau: product terms this company uses in both languages ───────
  'shell.groupSystem', 'sections.playbooks', 'sections.briefing',
  'sections.leads', 'sections.memory', 'dashboard.bAuditLabel',
  'model.stages.audit.name', 'model.stages.install.name',
  'model.recommendations.rec-1.tier',
  'toolRegister.tool', 'toolRegister.status',
  'contactsPage.name', 'contactsPage.status',
  // Channels a customer arrives through. Both are the product's name in
  // German and in English; they are in the catalogue rather than in a Record
  // of literals so that the three around them could be translated at all.
  'waitingRoom.channelWhatsapp', 'waitingRoom.channelSocial',
  // A key whose whole value is an interpolation of a proper noun.
  'dashboard.trailAgent', 'agentStatus.offline', 'demo.briefing.b-4Label',
])

const findings = []
const fail = (msg) => findings.push(msg)

/* ── Message files ────────────────────────────────────────────────────────── */

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    const isStringList = Array.isArray(v) && v.every((x) => typeof x === 'string')
    if (Array.isArray(v) && !isStringList) {
      // A list of objects is structure, not a string. Walk into it so each
      // leaf is compared, and so the two locales are compared item by item.
      v.forEach((item, i) => flatten(item, `${path}[${i}]`, out))
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, path, out)
    } else {
      out.set(path, v)
    }
  }
  return out
}

let checkedApps = 0
let totalKeys = 0

for (const app of APPS) {
  const dir = join(ROOT, app.messages)
  if (!existsSync(dir)) {
    fail(`${app.name}: no message directory at ${app.messages}`)
    continue
  }
  checkedApps++

  const loaded = {}
  for (const loc of LOCALES) {
    const p = join(dir, `${loc}.json`)
    if (!existsSync(p)) {
      fail(`${app.name}: ${loc}.json is missing — a declared language with no messages is not a language`)
      continue
    }
    try {
      loaded[loc] = flatten(JSON.parse(readFileSync(p, 'utf8')))
    } catch (error) {
      fail(`${app.name}: ${loc}.json does not parse — ${error.message}`)
    }
  }
  if (Object.keys(loaded).length !== LOCALES.length) continue

  const [a, b] = LOCALES
  totalKeys += loaded[a].size

  // 2. identical key sets
  for (const key of loaded[a].keys()) {
    if (!loaded[b].has(key)) fail(`${app.name}: ${key} exists in ${a} and not in ${b}`)
  }
  for (const key of loaded[b].keys()) {
    if (!loaded[a].has(key)) fail(`${app.name}: ${key} exists in ${b} and not in ${a}`)
  }

  for (const loc of LOCALES) {
    for (const [key, value] of loaded[loc]) {
      const values = Array.isArray(value) ? value : [value]

      // 3. nothing empty, nothing left as its own key
      for (const v of values) {
        if (typeof v !== 'string') {
          fail(`${app.name}: ${loc}.${key} is ${typeof v}, not text`)
        } else if (v.trim() === '') {
          fail(`${app.name}: ${loc}.${key} is empty`)
        } else if (v.trim() === key || v.trim() === key.split('.').pop()) {
          fail(`${app.name}: ${loc}.${key} is its own key, which is what an untranslated string looks like`)
        }
      }

      // arity between locales
      const other = loaded[loc === a ? b : a].get(key)
      if (Array.isArray(value) !== Array.isArray(other)) {
        fail(`${app.name}: ${key} is a list in one language and a single value in the other`)
      } else if (Array.isArray(value) && Array.isArray(other) && value.length !== other.length) {
        fail(`${app.name}: ${key} has ${value.length} item(s) in ${loc} and ${other.length} in the other language`)
      }
    }
  }

  // 4. the two languages are actually different.
  // Exemptions are full key paths, never leaf names: exempting "name" would
  // silently exempt every key ending in it, which is how a list of deliberate
  // decisions turns into a list of holes.
  for (const [key, value] of loaded[a]) {
    const other = loaded[b].get(key)
    if (typeof value !== 'string' || typeof other !== 'string') continue
    if (value !== other) continue
    if (SAME_IN_BOTH.has(key)) continue
    // A value with no letters (a mark, a number, a date pattern) cannot be
    // translated and is not evidence of anything.
    if (!/\p{Letter}{3}/u.test(value)) continue
    fail(`${app.name}: ${key} is the same text in both languages — "${value.slice(0, 48)}"`)
  }
}

if (checkedApps === 0) {
  console.error('i18n: no application with a message catalogue was found under ' + ROOT)
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

/* ── The agent registry's counts against the catalogue ────────────────────── */

/**
 * An agent's `blocked` list is a statement about what it may not do without
 * asking. If a translation quietly drops an entry, the English product claims
 * a narrower supervision contract than the German one — which is a safety
 * claim, not a wording difference. The registry states the count in structure;
 * this asserts the catalogue agrees, in both languages.
 */
const REGISTRY = join(ROOT, 'apps/bureau/lib/registry/agents.ts')
if (existsSync(REGISTRY)) {
  const src = readFileSync(REGISTRY, 'utf8')
  const bureauMessages = {}
  for (const loc of LOCALES) {
    const p = join(ROOT, `apps/bureau/messages/${loc}.json`)
    if (existsSync(p)) bureauMessages[loc] = JSON.parse(readFileSync(p, 'utf8')).agentRegistry ?? {}
  }

  const chunks = src.split(/(?=\n    id: ')/).concat(src.split(/(?=\n    id: ")/))
  const seenAgents = new Set()
  for (const chunk of chunks) {
    const id = (chunk.match(/\bid:\s*["']([^"']+)["']/) || [])[1]
    if (!id || seenAgents.has(id)) continue
    const caps = (chunk.match(/capabilityIds:\s*\[([^\]]*)\]/) || [, ''])[1].match(/["'][^"']+["']/g)
    if (!caps) continue
    seenAgents.add(id)

    const expect = {
      caps: caps.length,
      allowed: Number((chunk.match(/allowedCount:\s*(\d+)/) || [])[1]),
      blocked: Number((chunk.match(/blockedCount:\s*(\d+)/) || [])[1]),
    }
    for (const loc of LOCALES) {
      const entry = bureauMessages[loc]?.[id]
      if (!entry) {
        fail(`bureau: agentRegistry.${id} is missing from ${loc}.json`)
        continue
      }
      for (const [field, n] of Object.entries(expect)) {
        const list = entry[field]
        if (!Array.isArray(list)) {
          fail(`bureau: agentRegistry.${id}.${field} is missing or not a list in ${loc}.json`)
        } else if (list.length !== n) {
          fail(
            `bureau: agentRegistry.${id}.${field} has ${list.length} item(s) in ${loc} ` +
            `but the registry declares ${n}`,
          )
        }
      }
    }
  }
  if (seenAgents.size === 0) fail('bureau: parsed no agents out of the registry')
}

/* ── Hardcoded user-visible strings ───────────────────────────────────────── */

/**
 * SCAN — what counts as a finding, and why it is a heuristic.
 *
 * A string in a .tsx file may be a class name, an icon name, a database
 * column, a route or a sentence. Only the last one is a bug. Rather than guess
 * at all of them, this looks for the marks of German prose — the letters ä ö ü
 * ß, and a list of common German words — inside JSX text and inside string
 * literals that are not obviously technical.
 *
 * That is deliberately narrow, and for the product pages it stays that way:
 * the key-set and sameness checks above are what cover them.
 *
 * `scanEnglish` widens it for one kind of surface — chrome that reads from the
 * catalogue on a German-first site, where an English literal is as much a
 * missing translation as a German one. It is opt-in per application because
 * the heuristic is only safe where every user-visible string is supposed to
 * come from a message file; pointed at a product page it would report every
 * variable name that happens to read like a sentence.
 */
const GERMAN_WORDS = /\b(und|oder|nicht|keine|kein|eine|einen|einem|einer|wird|werden|wurde|sind|ist|haben|hat|Ihre|Ihrem|Ihren|Sie|wir|uns|über|für|von|mit|auf|dem|den|das|die|der|noch|mehr|alle|jede|jeden|bitte|abbrechen|speichern|löschen|zurück|weiter|anzeigen|bearbeiten|erstellen|freigeben|Freigabe|Übersicht|Einstellungen|Warteraum|Dokumente|Aufgaben|Anfragen|Kunden|Betrieb|Prüfung|Protokoll)\b/
const UMLAUT = /[äöüßÄÖÜ]/

/**
 * English prose in a catalogue-driven surface.
 *
 * Two shapes, because the leaks were of two shapes. A sentence gives itself
 * away with a function word; a control label — "Close", "Send", "Open Max",
 * "Business Advisor" — has none, so it is caught as Capitalised Words instead.
 * Both are only consulted where `scanEnglish` is set.
 */
const ENGLISH_WORDS = /\b(the|and|not|your|you|our|with|from|for|this|that|are|is|was|will|can|please|cancel|save|delete|back|next|show|edit|create|approve|close|send|open|search|loading|error|submit|continue)\b/i
const ENGLISH_LABEL = /^[A-Z][a-z]+(?: [A-Z]?[a-z]+){0,3}$/

const TECHNICAL = [
  /^[a-z0-9-]+$/i,                 // identifiers, slugs, css classes
  /^[\w./-]+$/,                    // paths, imports
  /^https?:\/\//,
  /^[A-Z_]+$/,                     // constants
  /^#[0-9a-f]{3,8}$/i,
  /^\d/,                           // starts with a number
  /^\s*$/,
]

const SKIP_FILES = [
  /messages[\\/]/,
  /\.test\./,
  /[\\/]api[\\/]/,          // API responses are not UI text
  /[\\/]mock[\\/]/,         // demo fixtures, classified separately
  /[\\/]db[\\/]/,           // schema and queries
  /[\\/]email/i,
]

/** A scan entry may name a directory to walk or a single file to read. */
const walk = (dir, out = []) => {
  if (!statSync(dir).isDirectory()) {
    if (/\.(tsx|ts)$/.test(dir)) out.push(dir)
    return out
  }
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(tsx|ts)$/.test(p)) out.push(p)
  }
  return out
}

let scannedFiles = 0
const hardcoded = []

for (const app of APPS) {
  if (!app.scanHardcoded) continue
  for (const dir of app.scan) {
    const full = join(ROOT, dir)
    if (!existsSync(full)) continue
    for (const file of walk(full)) {
      const rel = relative(ROOT, file).split(sep).join('/')
      if (SKIP_FILES.some((r) => r.test(rel))) continue
      if (app.scanExclude?.some((r) => r.test(rel))) continue
      scannedFiles++
      const raw = readFileSync(file, 'utf8')

      /**
       * `i18n-exempt` in a comment exempts from that line to the end of the
       * declaration it introduces (the next line that is exactly `];` or `}`).
       *
       * It exists for two real cases and no others: text that instructs a
       * model rather than a person, and product vocabulary that no surface
       * renders yet. The marker has to sit next to the thing it excuses, so
       * the reason is read by whoever next reads the code — an exemption list
       * kept in this file would be a list nobody visits.
       */
      const exempt = new Set()
      const rawLines = raw.split('\n')
      rawLines.forEach((line, i) => {
        if (!/i18n-exempt/.test(line)) return
        for (let j = i; j < rawLines.length; j++) {
          exempt.add(j)
          if (/^(\];|\}|\)|`;)\s*$/.test(rawLines[j].trim()) && j > i) break
        }
      })

      const source = stripComments(raw)
      const lines = source.split('\n')

      const report = (text, lineNo) => {
        const t = text.trim()
        if (t.length < 4) return
        if (TECHNICAL.some((r) => r.test(t))) return

        const german = UMLAUT.test(t) || GERMAN_WORDS.test(t)
        const english =
          app.scanEnglish && (ENGLISH_WORDS.test(t) || ENGLISH_LABEL.test(t))
        if (!german && !english) return

        hardcoded.push({
          file: rel,
          line: lineNo,
          lang: german ? 'German' : 'English',
          text: t.slice(0, 70),
        })
      }

      lines.forEach((line, i) => {
        if (exempt.has(i)) return
        /**
         * Quoted literals, and JSX text that opens and closes on one line.
         *
         * The quote patterns match a string of ANY length and the length rule
         * is applied afterwards, in `report`. Requiring four characters inside
         * the pattern looks equivalent and is not: a short value earlier on
         * the line desynchronises the pairing, and everything after it is read
         * against the wrong quotes. On
         *
         *     <Icon name="close" size="sm" label="Menü schließen" />
         *
         * the old pattern skipped `"sm"` for being too short, then matched
         * `" label="` as though it were a string — which consumed the opening
         * quote of the label and left "Menü schließen" invisible. That is how
         * a German accessible name shipped on the close control of the mobile
         * navigation, on every page of the site, past a green audit.
         */
        const candidates = [
          ...[...line.matchAll(/>([^<>{}]{4,})</g)].map((m) => m[1]),
          ...[...line.matchAll(/"([^"\\]*)"/g)].map((m) => m[1]),
          ...[...line.matchAll(/'([^'\\]*)'/g)].map((m) => m[1]),
        ]
        for (const c of candidates) report(c, i + 1)
      })

      /**
       * JSX text that spans lines.
       *
       * The per-line pass needs the `>` and the `<` on one line, so a table
       * head written the way a formatter writes it — the tag, then the words
       * on their own line, then the closing tag — was invisible to it, and
       * this audit reported clean over a German heading sitting in an English
       * product. Same rule, same text, read across the newline that a
       * line-oriented regex cannot see past.
       */
      for (const m of source.matchAll(/>([^<>{}]{4,}?)</gs)) {
        const text = m[1]
        if (!text.includes('\n')) continue          // the pass above had it
        const lineNo = source.slice(0, m.index).split('\n').length
        if (exempt.has(lineNo - 1)) continue
        report(text.replace(/\s+/g, ' '), lineNo)
      }
    }
  }
}

if (scannedFiles === 0) {
  console.error('i18n: the hardcoded-string scan found no files to read.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

for (const h of hardcoded) {
  fail(`${h.file}:${h.line} — ${h.lang} text in source, not in a message file: "${h.text}"`)
}

/* ── Report ───────────────────────────────────────────────────────────────── */

console.log('='.repeat(74))
if (!findings.length) {
  console.log(
    `I18N: clean — ${checkedApps} application(s), ${LOCALES.length} locales, ` +
    `${totalKeys} keys per locale, ${scannedFiles} source file(s) scanned`,
  )
} else {
  console.log(`I18N: ${findings.length} finding(s)\n`)
  for (const f of findings.slice(0, 60)) console.log(`  ${f}`)
  if (findings.length > 60) console.log(`  … and ${findings.length - 60} more`)
  console.log('\nA supported language is complete across the product, not just the landing')
  console.log('page. Add the key to BOTH message files, or move the string out of the')
  console.log('component. If two languages genuinely share a word, name the key in')
  console.log('SAME_IN_BOTH in this file — an exemption is a decision, not a silence.')
  process.exitCode = 1
}
