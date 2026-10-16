/**
 * lib/channels/guard.ts
 *
 * The last check between a model's words and a customer's phone.
 *
 * The model has no tools and sees no business data beyond its own
 * conversation, so a prompt injection cannot *do* anything. What it could
 * still do is make Max *say* something: a price, a discount, a promise, a
 * link to somewhere else, the instructions themselves. This refuses those
 * shapes deterministically, whatever the model was talked into.
 *
 * A refused reply is replaced by fixed copy and Marcel is told. The reason is
 * logged; it is never shown to the customer.
 */

import { SECRETISH } from '../commercial/audit.ts'

export type GuardFlag =
  | 'empty'
  | 'instructions_leaked'
  | 'secret_shape'
  | 'price_or_amount'
  | 'discount'
  | 'commitment'
  | 'foreign_link'
  | 'foreign_email'
  | 'phone_number'

export interface GuardVerdict {
  ok: boolean
  flags: GuardFlag[]
  /** The reply as it may be sent: trimmed and capped. Meaningless when !ok. */
  text: string
}

export const MAX_REPLY = 1200

const SECRET = new RegExp(SECRETISH.source, 'i')
const MONEY = /(€|\beur\b|\beuro\b|\busd\b|\$|£|\bchf\b)\s?\d|\d[\d.,']*\s?(€|\beur\b|\beuro\b|\busd\b|\$|£|k€|tsd)/i
/* A price stated without a currency sign: a price word, a stating word, then a
   number. Not "kostet" alone — "das kostet Sie jeden Freitag zwei Stunden" is
   the problem being named, not a quote (live run, 2026-10-16); and not "ab 9",
   which in German is far more often a time than a price. */
const PRICE_WORDS = /\b(preis(e|en)?|kosten|kostet|price[sd]?|costs?|budget|honorar|tagessatz|stundensatz|rate)\b[^.\n?!]{0,25}\b(liegt|liegen|beträgt|betragen|von|ab|bei|ca\.?|etwa|ungefähr|rund|is|are|from|around|about|roughly|starting|starts|at)\b[^.\n?!]{0,12}\d|\bstarting\s+(at|from)\s+\d/i
/* No \b after "%": between "%" and a space there is no word boundary to match. */
const DISCOUNT = /(\b\d{1,3}\s?%|\bprozent\b)[^.\n]{0,30}\b(rabatt|nachlass|discount|off|günstiger)\b|\b(rabatt|nachlass|discount)\b[^.\n]{0,30}(\b\d{1,3}\s?%|\bvon\b|\bof\b)/i
const COMMITMENT = /\b(i|we)\s+(guarantee|promise|commit)\b|\bgarantier|\bverbindlich(e[nrs]?)?\s+(angebot|zusage|preis)|\bbinding\s+(offer|quote|price)|\b(we|i)\s+will\s+(deliver|have it (done|ready)|finish)\b|\b(wir|ich)\s+(liefern|erledigen|garantieren)\b[^.\n]{0,40}\b(bis|innerhalb|within)\b/i
const URL = /\b(?:https?:\/\/|www\.)[^\s)]+|\b[a-z0-9-]+\.(?:com|net|org|io|de|ai|co|app|info|biz|xyz|ru|cn|ly|me|link)(?:\/[^\s)]*)?\b/gi
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const PHONE = /(?:\+|\b00)\d[\d\s/-]{7,}\d/g

const OWN_DOMAIN = /^(?:https?:\/\/)?(?:www\.)?maxpromo\.digital(?:[/?#].*)?$/i
const OWN_EMAIL = 'info@maxpromo.digital'

/**
 * Phrases only the system prompt contains. If one appears in a reply, the
 * model is reciting its instructions.
 */
export const PROMPT_MARKERS = ['UNDERSTAND FIRST', 'ROUTE SECOND', 'SELL LAST', 'CUSTOMER_MESSAGE', 'respond tool', 'system prompt', 'Systemprompt']

export function guardReply(raw: string, opts: { canary: string }): GuardVerdict {
  const flags = new Set<GuardFlag>()
  let text = (raw ?? '').replace(/\r\n?/g, '\n').trim()
  if (!text) return { ok: false, flags: ['empty'], text: '' }

  if (text.includes(opts.canary) || PROMPT_MARKERS.some((m) => text.toLowerCase().includes(m.toLowerCase()))) flags.add('instructions_leaked')
  if (SECRET.test(text)) flags.add('secret_shape')
  if (MONEY.test(text) || PRICE_WORDS.test(text)) flags.add('price_or_amount')
  if (DISCOUNT.test(text)) flags.add('discount')
  if (COMMITMENT.test(text)) flags.add('commitment')
  for (const m of text.match(URL) ?? []) if (!OWN_DOMAIN.test(m) && !m.toLowerCase().endsWith('maxpromo.digital')) flags.add('foreign_link')
  for (const m of text.match(EMAIL) ?? []) if (m.toLowerCase() !== OWN_EMAIL) flags.add('foreign_email')
  if ((text.match(PHONE) ?? []).length) flags.add('phone_number')

  if (text.length > MAX_REPLY) {
    const cut = text.slice(0, MAX_REPLY)
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '), cut.lastIndexOf('\n'))
    text = (end > MAX_REPLY / 2 ? cut.slice(0, end + 1) : cut).trim()
  }
  return { ok: flags.size === 0, flags: [...flags], text }
}
