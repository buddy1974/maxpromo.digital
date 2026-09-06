/**
 * primitives/Icon.tsx
 *
 * One icon set, one stroke weight, one size system.
 *
 * WHAT THIS REPLACES
 *
 * An audit of both applications found 36 distinct Unicode marks used as icons
 * across 68 files — geometric shapes, dingbats, arrows and box-drawing
 * characters, mixed freely. Three separate navigations had each invented their
 * own vocabulary, and the vocabularies disagreed:
 *
 *     mark   internal OS        Agent Bureau
 *     ❖      Clients            Operating Model
 *     ▤      Invoices           Briefing
 *     ▦      Angebote           Aufgaben
 *     ◉      Jobs               Audit Console
 *     ◷      Inbox              Warteraum
 *     ▥      Newsletter         Research
 *
 * So the same mark meant six different pairs of things to a user moving between
 * two applications of one platform. That is a harder problem than inconsistent
 * stroke weight, and it is invisible in a screenshot of either one alone.
 *
 * The marks were also a rendering risk. A glyph is drawn by whatever font
 * happens to cover it; ⊟, ◰, ⚐ and ❑ have thin coverage on Windows and
 * Android, where they fall back to a different face at a different weight and
 * optical size, or to a replacement box. An SVG renders the same everywhere.
 *
 * THE RULES THIS FILE ENFORCES
 *
 *   Stroke, never fill. 1.5px at every size, round caps and joins.
 *   currentColor, always — an icon inherits its context and can never
 *     introduce a colour, which is also why none of these can regress the
 *     accent-as-text rule.
 *   Four sizes, no others: 14, 16, 20, 24.
 *   Decorative by default. An icon is aria-hidden unless given a `label`,
 *     because most icons sit beside text that already says the same thing and
 *     a screen reader should not read it twice. Passing `label` makes it a
 *     role="img" with a title — for the rare icon that is the only content of
 *     a control.
 *
 * Adding an icon means adding a path here. It does not mean reaching for a
 * character that looks close enough.
 */

export type IconName = keyof typeof PATHS

const SIZES = { xs: 14, sm: 16, md: 20, lg: 24 } as const
export type IconSize = keyof typeof SIZES

/**
 * Every path is drawn on a 24×24 grid so stroke weight stays optically equal
 * across the set. Grouped by what they are for, not alphabetically, so a gap
 * in the vocabulary is visible.
 */
const PATHS = {
  // ── Navigation: internal OS ───────────────────────────────────────────────
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  clients: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </>
  ),
  invoice: (
    <>
      <path d="M14 3v5h5" />
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M9 13h6M9 17h4" />
    </>
  ),
  quote: (
    <>
      <path d="M14 3v5h5" />
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  jobs: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  leads: <path d="M3 4h18l-7 8v7l-4 2v-9z" />,
  newsletter: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),

  // ── Navigation: Agent Bureau ──────────────────────────────────────────────
  operatingModel: (
    <>
      <path d="m12 2 9 5-9 5-9-5z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </>
  ),
  audit: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
      <path d="m8.5 11 2 2 4-4" />
    </>
  ),
  waiting: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  documents: (
    <>
      <path d="M14 3v5h5" />
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    </>
  ),
  approvals: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  governance: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22V4" />
    </>
  ),
  playbooks: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  implementation: (
    <>
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  briefing: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  tasks: (
    <>
      <rect x="3" y="5" width="6" height="6" rx="1" />
      <path d="m4.5 8 1 1 2-2" />
      <path d="M12 7h9M12 17h9" />
      <rect x="3" y="15" width="6" height="6" rx="1" />
    </>
  ),
  projects: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18" />
    </>
  ),
  research: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  agents: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="12" cy="18" r="3" />
      <path d="M8.5 7.5 10.5 15.5M15.5 7.5 13.5 15.5M9 6h6" />
    </>
  ),
  memory: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  lab: (
    <>
      <path d="M10 2v6.5L4.5 18A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 8.5V2" />
      <path d="M8.5 2h7" />
    </>
  ),
  settings: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </>
  ),

  // ── Actors and objects ────────────────────────────────────────────────────
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  system: (
    <>
      <rect x="2" y="3" width="20" height="8" rx="2" />
      <rect x="2" y="13" width="20" height="8" rx="2" />
      <path d="M6 7h.01M6 17h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  /** Quality: a mark of standard met, distinct from an approval decision. */
  quality: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),

  // ── Trend ─────────────────────────────────────────────────────────────────
  trendUp: (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  trendDown: (
    <>
      <path d="m3 7 6 6 4-4 8 8" />
      <path d="M15 17h6v-6" />
    </>
  ),
  trendFlat: <path d="M3 12h18" />,

  // ── Status ────────────────────────────────────────────────────────────────
  check: <path d="m20 6-11 11-5-5" />,
  cross: <path d="M18 6 6 18M6 6l12 12" />,
  warning: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  running: (
    <>
      <circle cx="12" cy="12" r="9" opacity="0.35" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  /** A deliberately incomplete circle: nothing here yet. */
  empty: <circle cx="12" cy="12" r="9" strokeDasharray="4 3" />,

  // ── Controls and affordances ──────────────────────────────────────────────
  close: <path d="M18 6 6 18M6 6l12 12" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  external: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </>
  ),
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  send: (
    <>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </>
  ),
} as const

interface IconProps {
  name: IconName
  /** 14 / 16 / 20 / 24. Defaults to 16, the size that sits with body text. */
  size?: IconSize
  /**
   * Give this only when the icon is the sole content of a control. An icon
   * beside its own label must stay silent, or the label is announced twice.
   */
  label?: string
  className?: string
}

export function Icon({ name, size = 'sm', label, className }: IconProps) {
  const px = SIZES[size]

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      // Decorative unless named. See the note on `label` above.
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      focusable="false"
      // Icons scale with their text but must never stretch a flex row.
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
    >
      {label ? <title>{label}</title> : null}
      {PATHS[name]}
    </svg>
  )
}
