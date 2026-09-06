/**
 * packages/design-tokens/index.ts
 *
 * TypeScript mirror of packages/design-tokens/brand.css.
 *
 * WHY THIS FILE EXISTS
 * Email clients do not reliably support CSS custom properties, so email HTML
 * (lib/email.ts, the transactional templates in app/api/**) cannot consume
 * `var(--brand-primary)`. Rather than let those surfaces drift back to
 * hardcoded hex — which is exactly how they ended up with 158 raw colour
 * values — they import the same values from here.
 *
 * The two files are a matched pair. brand.css is authoritative for the web;
 * this is authoritative for email, PDF generation and any inline-style context
 * that cannot resolve custom properties. CHANGING ONE MEANS CHANGING BOTH.
 *
 * Moves to packages/tokens/ in the monorepo consolidation.
 */

/** Raw primitives. Mirrors LAYER 1. Do not use directly in a component. */
export const primitive = {
  black:      '#111111',
  white:      '#FFFFFF',
  gray50:     '#FAFAFA',
  gray100:    '#F4F4F5',
  gray200:    '#E4E4E7',
  gray300:    '#D4D4D8',
  gray400:    '#A1A1AA',
  gray500:    '#71717A',
  gray600:    '#52525B',
  gray700:    '#3F3F46',
  gray800:    '#27272A',
  gray900:    '#18181B',

  lime50:     '#F7FEE7',
  lime100:    '#ECFCCB',
  lime200:    '#D9F99D',
  lime300:    '#BEF264',
  lime400:    '#A3E635',
  lime500:    '#84CC16',
  lime600:    '#65A30D',
  lime700:    '#4D7C0F',
  lime800:    '#3F6212',
  lime900:    '#365314',

  emerald700: '#047857',
  emerald50:  '#ECFDF5',
  amber700:   '#B45309',
  amber50:    '#FFFBEB',
  red700:     '#B91C1C',
  red50:      '#FEF2F2',
  blue700:    '#1D4ED8',
  blue50:     '#EFF6FF',
} as const

/** Semantic tokens. Mirrors LAYER 2. This is what callers use. */
export const token = {
  background:      primitive.white,
  surface:         primitive.white,
  surfaceSubtle:   primitive.gray50,
  surfaceSunken:   primitive.gray100,
  surfaceAccent:   primitive.lime50,
  surfaceInverted: primitive.black,

  border:          primitive.gray200,
  borderStrong:    primitive.gray300,

  text:            primitive.black,
  textSecondary:   primitive.gray600,
  textMuted:       primitive.gray500,
  textInverted:    primitive.gray100,

  /** Fill only — lime text on white is 1.51:1 and illegible. */
  primary:         primitive.lime400,
  primaryHover:    primitive.lime500,
  primaryDark:     primitive.lime600,
  /** The accessible accent *text* colour — 5.00:1 on white. */
  primaryText:     primitive.lime700,
  primarySoft:     primitive.lime50,
  /** Text ON primary. Black, never white. 12.62:1. */
  onPrimary:       primitive.black,

  success:         primitive.emerald700,
  successSoft:     primitive.emerald50,
  warning:         primitive.amber700,
  warningSoft:     primitive.amber50,
  danger:          primitive.red700,
  dangerSoft:      primitive.red50,
  info:            primitive.blue700,
  infoSoft:        primitive.blue50,
} as const

/**
 * Type scale in absolute px, for email and PDF where clamp() is unavailable.
 * The web uses the fluid clamp values in brand.css.
 */
export const type = {
  h1:     { size: '32px', weight: 700, leading: '1.15' },
  h2:     { size: '24px', weight: 600, leading: '1.2'  },
  h3:     { size: '19px', weight: 600, leading: '1.3'  },
  body:   { size: '15px', weight: 400, leading: '1.65' },
  small:  { size: '13px', weight: 400, leading: '1.5'  },
  micro:  { size: '12px', weight: 500, leading: '1.4'  },
  fontSans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const

/** 8px spacing scale, px strings for inline-style contexts. */
export const space = {
  1: '4px',  2: '8px',   3: '12px', 4: '16px',
  5: '24px', 6: '32px',  8: '48px', 10: '64px',
  12: '72px', 16: '96px', 20: '112px', 24: '160px',
} as const

export const radius = {
  sm: '4px', md: '6px', lg: '8px', xl: '12px', full: '999px',
} as const
