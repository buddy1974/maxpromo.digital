import { token } from '@maxpromo/design-tokens'

/**
 * lib/documents/config.ts
 *
 * Presentation and types for every invoice, angebot, print document and
 * transactional email: palette, payment-method labels, currencies,
 * languages. Safe to import from client components.
 *
 * The business identity, bank details and MTN MoMo configuration that used
 * to live here are in ./identity.ts, server-side only. While they were here,
 * every client component that imported this module compiled the street
 * address, tax number, IBAN and MoMo number into public static JavaScript
 * that anyone could download without logging in (known risk 69).
 *
 * Legal (Kleinunternehmer / §19 UStG): never calculate or display VAT or a
 * VAT percentage anywhere a document renders. The mandatory clause itself is
 * part of the identity (./identity.ts).
 */

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
  /** Text on the inked letterhead band. Added v14.0 — emailHtml.ts was
   *  reaching for `var(--brand-text-inverted)`, which no email client
   *  resolves. */
  textInverted: token.textInverted,
} as const

/** Every payment method the document system knows how to render. */
export type PaymentMethodId = 'bank' | 'momo' | 'both'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodId, { de: string; en: string }> = {
  bank: { de: 'Banküberweisung', en: 'Bank Transfer' },
  momo: { de: 'MTN Mobile Money', en: 'MTN Mobile Money' },
  both: { de: 'Banküberweisung oder MTN MoMo', en: 'Bank Transfer or MTN MoMo' },
}


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
