/**
 * lib/third-party-brands.ts
 *
 * Colours that belong to other companies.
 *
 * A WhatsApp button has to look like WhatsApp's button to be recognised as
 * one, so these are deliberately literal and deliberately outside the token
 * system — they are not ours to change, and putting them in the brand tokens
 * would imply they follow our brand. The design-token check allowlists this
 * file by name.
 */

export const THIRD_PARTY = {
  /** WhatsApp brand green. Black text on it measures 6.7:1. */
  whatsapp: '#25D366',
  whatsappTint: 'color-mix(in srgb, #25D366 12%, transparent)',
} as const
