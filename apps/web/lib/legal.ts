/**
 * lib/legal.ts
 *
 * LOCKED business identity. One source of truth for every surface that states
 * who the company is: Impressum, Datenschutz, AGB, the footer, JSON-LD, the
 * data-deletion page, invoices, quotations and every transactional email.
 *
 * Before this module existed the same facts were hardcoded in eight places,
 * including a misspelling ("Koernerstr. 8") that shipped in the newsletter
 * confirmation email. The pattern is adopted from maxpromo-agent-bureau's
 * config/legal.ts, which had it right.
 *
 * The §19 UStG clause is legally required on every commercial surface
 * (Kleinunternehmerregelung). It must never be removed or altered, and VAT must
 * never be calculated or displayed anywhere in the platform.
 */

export const BUSINESS = {
  legalName: 'Marcel Tabit Akwe',
  brand: 'Maxpromo Digital',
  street: 'Körnerstr. 8',
  postalCode: '45143',
  city: '45143 Essen',
  cityName: 'Essen',
  country: 'Deutschland',
  countryCode: 'DE',
  steuernummer: '111/5339/7597',
  finanzamt: 'Essen-NordOst',
  email: 'info@maxpromo.digital',
  phone: '+49 173 3645698',
  website: 'maxpromo.digital',
} as const

/** Required on every commercial surface (Kleinunternehmer § 19 UStG). Do not change. */
export const UST_CLAUSE = {
  de: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
  en: 'No VAT is charged pursuant to § 19 UStG.',
} as const
