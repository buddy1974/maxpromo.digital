/**
 * @maxpromo/config — legal identity
 *
 * LOCKED. One source of truth for who the company is, used by every surface
 * that states it: Impressum, Datenschutz, AGB, footers, JSON-LD, the
 * data-deletion page, invoices, quotations and every transactional email.
 *
 * This module merges what were two divergent copies — `lib/legal.ts` in the
 * web application and `config/legal.ts` in Agent Bureau. They did not agree:
 *
 *   finanzamt   "Essen-NordOst"  vs  "FA Essen-NordOst"
 *   phone       present          vs  absent
 *   postalCode  present          vs  absent
 *   product     absent           vs  "Max Agent"
 *
 * Two sources of one legal truth is how an Impressum ends up disagreeing with
 * an invoice. Resolved as follows:
 *   - `finanzamt` keeps the bare form "Essen-NordOst"; callers that want the
 *     "FA " prefix render it, because it is presentation, not identity.
 *   - `product` is not identity — it is an application's own name — so it
 *     lives with the application, not here.
 *   - Everything else is the union of the two.
 *
 * The §19 UStG clause is legally required on every commercial surface
 * (Kleinunternehmerregelung). It must never be removed or altered, and VAT
 * must never be calculated or displayed anywhere in the platform.
 */

export const BUSINESS = {
  legalName: 'Marcel Tabit Akwe',
  brand: 'Maxpromo Digital',
  street: 'Körnerstr. 8',
  postalCode: '45143',
  /** Postal line as printed: "45143 Essen". */
  city: '45143 Essen',
  /** City alone, for prose and structured data. */
  cityName: 'Essen',
  country: 'Deutschland',
  countryCode: 'DE',
  steuernummer: '111/5339/7597',
  /** Bare form. Render "FA {finanzamt}" where that prefix is wanted. */
  finanzamt: 'Essen-NordOst',
  email: 'info@maxpromo.digital',
  phone: '+49 173 3645698',
  website: 'maxpromo.digital',
} as const

/**
 * The company's number in the form `wa.me` expects: country code first, digits
 * only, no plus and no spaces.
 *
 * Derived from `BUSINESS.phone` rather than written out again, because it was
 * written out again and the two copies were both wrong. The article pages read
 * `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` with a hardcoded fallback, the
 * variable was declared in no env file and set in no environment, and the two
 * call sites did not even agree on their fallback: one said 4915901234567 and
 * the other 491234567890. Both are placeholders. Both were live on
 * maxpromo.digital, on every article, sending readers who pressed "WhatsApp
 * Maxpromo" to a number that is not this company's.
 *
 * A contact destination is legal identity, not configuration. It belongs where
 * the Impressum gets its number, so that the two cannot disagree — which is
 * the same reason this module exists at all.
 */
export const WHATSAPP_NUMBER = BUSINESS.phone.replace(/\D/g, '')

/** Required on every commercial surface (Kleinunternehmer § 19 UStG). Do not change. */
export const UST_CLAUSE = {
  de: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
  en: 'No VAT is charged pursuant to § 19 UStG.',
} as const

export type BusinessIdentity = typeof BUSINESS
