/**
 * lib/documents/identity.ts — SERVER ONLY.
 *
 * The business identity, bank details and MTN MoMo configuration printed on
 * every invoice and quotation and in every document email. Commercial
 * documents must carry them; public static files must not.
 *
 * Import this only from server code: API routes and server-side builders.
 * Client components receive it from the authenticated
 * `GET /api/os/document-identity` through `useDocumentIdentity()`
 * (components/documents/useDocumentIdentity.ts), so it never enters a
 * JavaScript chunk that can be fetched without logging in.
 * `npm run check:public-assets` fails the build if any of these values
 * appears in `.next/static`.
 *
 * Legal (Kleinunternehmer / §19 UStG):
 *   - Never calculate or display VAT / a VAT percentage.
 *   - Never invent a USt-ID — this business does not have one.
 *   - The §19 UStG clause is mandatory on every invoice and angebot.
 */

import { BUSINESS as LEGAL, UST_CLAUSE } from '@maxpromo/config'

/**
 * Document letterhead identity.
 *
 * The legal facts come from @maxpromo/config — they are the same facts the
 * Impressum and Agent Bureau state, and they must not be restated
 * here. This module adds only what is specific to a printed document: the
 * letterhead wordmark and the address split into layout lines.
 *
 * Until 2026-09-03 this was a third independent copy of the business identity,
 * and it had already drifted: it said `country: 'Germany'` where the other two
 * said 'Deutschland'. It prints on invoices and quotations, which is the worst
 * place for that to be wrong.
 */
export const BUSINESS = {
  legalName: LEGAL.legalName,
  /** Letterhead wordmark. Presentation, not identity. */
  brand: 'MAXPROMO',
  brandFull: 'MAXPROMO DIGITAL',
  website: LEGAL.website,
  /** The address split for a two-line letterhead block. */
  addressLine1: LEGAL.street,
  addressLine2: LEGAL.city,
  country: LEGAL.country,
  email: LEGAL.email,
  phone: LEGAL.phone,
  steuernummer: LEGAL.steuernummer,
  finanzamt: LEGAL.finanzamt,
  vatClause: UST_CLAUSE,
} as const

/**
 * Bank transfer details. This is the account currently used for GBP/EUR
 * client invoicing (Revolut multi-currency business account).
 */
export const BANK_TRANSFER = {
  beneficiary: 'Marcel Tabit Akwe',
  iban: 'DE03 1001 0178 3648 4449 24',
  bic: 'REVODEB2',
  bank: 'Revolut Ltd',
} as const

/**
 * MTN Mobile Money. The QR code is generated at render time (see
 * components/documents/MomoQrCode.tsx) from `url` below — never from a
 * static screenshot — so it is always a crisp, print-safe vector and
 * always encodes the exact URL configured here. Change the number/URL
 * in this one place and every future document picks it up.
 */
export const MTN_MOMO = {
  number: '237675245371',
  url: 'https://appbiz.momo.africa/momo/request-momo/237675245371',
} as const

export interface DocumentIdentity {
  readonly business: typeof BUSINESS
  readonly bank: typeof BANK_TRANSFER
  readonly momo: typeof MTN_MOMO
}

export const DOCUMENT_IDENTITY: DocumentIdentity = {
  business: BUSINESS,
  bank: BANK_TRANSFER,
  momo: MTN_MOMO,
}
