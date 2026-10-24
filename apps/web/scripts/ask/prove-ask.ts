/**
 * Ask Max, offline (risk 134): the answer follows the language of the question, and money questions
 * about a named invoice route to the payment facts (ledger + card charge + fee), not the receivables
 * list. The database-backed half lives in prove-ask-evidence.ts.
 */
import { invoiceNumberIn, questionLanguage, routeByKeywords } from '../../lib/commercial/ask.ts'

let passed = 0
function check(name: string, ok: boolean) {
  if (!ok) { console.error(`FAIL ${name}`); process.exit(1) }
  passed++; console.log(`PASS ${name}`)
}

check('a German question on an English screen is answered in German', questionLanguage('Ist MP-2026-044 bezahlt, wie und mit welcher Gebühr?', 'en') === 'de')
check('an English question on a German screen is answered in English', questionLanguage('How was invoice MP-2026-044 paid and what fee did we pay?', 'de') === 'en')
check('who owes me money (EN) → en; wer schuldet mir Geld (DE) → de', questionLanguage('Who owes me money?', 'de') === 'en' && questionLanguage('Wer schuldet mir Geld?', 'en') === 'de')
check('umlauts alone mark German', questionLanguage('Überfällige Rechnungen?', 'en') === 'de')
check('a bare name or number keeps the screen language', questionLanguage('MP-2026-044', 'en') === 'en' && questionLanguage('Beckmann', 'de') === 'de')
check('invoice numbers are found and normalised', invoiceNumberIn('ist mp-2026-044 bezahlt?') === 'MP-2026-044' && invoiceNumberIn('wer schuldet mir geld') === null)
check('"how was X paid / fee" routes to payment facts', routeByKeywords('Ist MP-2026-044 bezahlt, wie und mit welcher Gebühr?') === 'payment_status' && routeByKeywords('How was invoice MP-2026-044 paid and what fee did we pay?') === 'payment_status')
check('"did X pay" with a number routes to payment facts', routeByKeywords('Did MP-2026-002 get paid?') === 'payment_status')
check('Stripe fees and payouts route to payment facts', routeByKeywords('Was haben wir an Stripe-Gebühren gezahlt?') === 'payment_status' && routeByKeywords('When is the next payout?') === 'payment_status')
check('"who owes me money" stays the receivables question', routeByKeywords('Wer schuldet mir Geld?') === 'money' && routeByKeywords('Who owes me money?') === 'money')
check('reply questions are not stolen by the money route', routeByKeywords('Wer braucht eine Antwort?') === 'replies_needed')
check('the phone prompts route where they should', routeByKeywords('Was sollte ich als Nächstes erledigen?') === 'attention' && routeByKeywords('What should I handle next?') === 'attention'
  && routeByKeywords('Worauf warten die Agenten?') === 'agents_blocked' && routeByKeywords('What are the agents waiting for?') === 'agents_blocked')

console.log(`\nprove-ask: ${passed} passed`)
