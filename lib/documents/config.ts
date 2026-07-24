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

export const BUSINESS = {
  legalName: 'Marcel Tabit Akwe',
  brand: 'MAXPROMO',
  brandFull: 'MAXPROMO DIGITAL',
  website: 'maxpromo.digital',
  addressLine1: 'Körnerstr. 8',
  addressLine2: '45143 Essen',
  country: 'Germany',
  email: 'info@maxpromo.digital',
  phone: '+49 173 3645698',
  steuernummer: '111/5339/7597',
  finanzamt: 'Essen-NordOst',
  vatClause: {
    de: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
    en: 'No VAT is charged pursuant to § 19 UStG.',
  },
} as const

export const BRAND_COLORS = {
  ink: '#0A0A0A',
  accent: '#F97316',
  white: '#FFFFFF',
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
