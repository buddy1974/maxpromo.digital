/**
 * components/systems/SystemGrid/config.ts
 *
 * Central source of truth for responsive card grid layouts.
 *
 * Rules:
 *   — Consumers choose a variant. The grid decides the layout.
 *   — Column counts are never set at the page or bridge level.
 *   — All class strings are written as complete literals so Tailwind's
 *     content scanner detects them at build time (no template construction).
 *   — To change a breakpoint, edit this file only.
 *
 * Responsive matrix:
 *   compact:  mobile=1 · tablet(md)=2 · desktop(lg)=3
 *   featured: mobile=1 · tablet(md)=2 · desktop(lg)=3
 *   full:     mobile=1 · tablet(md)=1 · desktop(lg)=2
 *   admin:    mobile=1 · tablet(md)=1 · desktop(lg)=1
 *   table:    mobile=1 · tablet(md)=1 · desktop(lg)=1
 */

import type { CardVariant } from '../SystemCard/SystemCard'

/**
 * Maps each card variant to its Tailwind responsive grid class string.
 * Import this constant — never reconstruct it inline.
 */
export const RESPONSIVE_GRID_CLASSES: Record<CardVariant, string> = {
  compact:  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  featured: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  full:     'grid-cols-1 lg:grid-cols-2',
  admin:    'grid-cols-1',
  table:    'grid-cols-1',
}
