import { token } from '@maxpromo/design-tokens'
import { BUSINESS as LEGAL, UST_CLAUSE } from '@maxpromo/config'

/**
 * lib/documents/config.ts
 *
 * Single source of truth for the business identity, bank details and
 * MTN MoMo payment configuration used across every invoice, angebot,
 * print document and transactional email.
 *
 * Before this module existed, this exact block was hardcoded
 * independently in six places (both print pages, both live-preview
 * panes in the "new" forms, and both send-invoice/send-angebot email
 * builders). Change a bank detail here once — every document, PDF and
 * email picks it up.
 *
 * Legal (Kleinunternehmer / §19 UStG):
 *   - Never calculate or display VAT / a VAT percentage.
 *   - Never invent a USt-ID — this business does not have one.
 *   - The §19 UStG clause below is mandatory on every invoice and angebot.
 */

/**
 * Document letterhead identity.
 *
 * The legal facts come from @maxpromo/config — they are the same facts the
 * Impressum, the footer and Agent Bureau state, and they must not be restated
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
 * Document palette, derived from the platform token module rather than
 * restated here. Documents and emails cannot resolve CSS custom properties,
 * so they read the TypeScript mirror in @maxpromo/design-tokens — same values, same
 * source, one place to change them.
 *
 * `accent` and `accentText` are deliberately distinct, for the same reason
 * the web tokens separate them: the brand accent is a FILL. As small text it
 * is illegible, so any accent-coloured label, caption or table figure must
 * use `accentText`, which is contrast-checked for body text on white.
 * `onAccent` is the text colour that sits ON an accent fill — black, never
 * white.
 */
export const BRAND_COLORS = {
  ink: token.text,
  accent: token.primary,
  accentText: token.primaryText,
  accentSoft: token.primarySoft,
  onAccent: token.onPrimary,
  muted: token.textSecondary,
  faint: token.textMuted,
  border: token.border,
  borderStrong: token.borderStrong,
  surfaceSubtle: token.surfaceSubtle,
  white: token.surface,
} as const

/** Every payment method the document system knows how to render. */
export type PaymentMethodId = 'bank' | 'momo' | 'both'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodId, { de: string; en: string }> = {
  bank: { de: 'Banküberweisung', en: 'Bank Transfer' },
  momo: { de: 'MTN Mobile Money', en: 'MTN Mobile Money' },
  both: { de: 'Banküberweisung oder MTN MoMo', en: 'Bank Transfer or MTN MoMo' },
}

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

/** Currencies the document system can render. Extend here, not per-file. */
export type CurrencyCode = 'EUR' | 'GBP'

export const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  EUR: 'de-DE',
  GBP: 'en-GB',
}

export const DEFAULT_CURRENCY: CurrencyCode = 'EUR'
export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = 'bank'

/**
 * Document language — independent of the OS interface language. A German
 * user can generate an English invoice for a UK client and vice versa;
 * this is never inferred from the OS's own display language.
 */
export type DocumentLanguage = 'de' | 'en'
export const DEFAULT_DOCUMENT_LANGUAGE: DocumentLanguage = 'de'
