#!/usr/bin/env node
/**
 * packages/tooling/make-brand-assets.mjs
 *
 * Technical derivatives of Marcel's approved brand masters. It derives; it
 * never designs.
 *
 * THE MASTERS — the source of truth, supplied and approved by Marcel
 *
 *   apps/web/public/images/brand/maxpromo-digital-logo.png  primary logo
 *       Horizontal: MAX lime, PROMO dark, DIGITAL subordinate. Transparent.
 *   apps/web/public/images/brand/maxpromo-mark.png          compact mark
 *       Transparent. Its dark half disappears on black, so it is never the
 *       favicon. Not derived from here; declared in the Brand Registry.
 *   apps/web/public/images/brand/maxpromo-icon.png          icon master
 *       The rounded black square with the lime and white M, drawn for small
 *       sizes, on a white canvas. Every favicon and app icon comes from it.
 *   apps/web/public/images/seo/maxpromo-digital-og.png      social card
 *       The approved 1200×630 card, used as it is. This script only checks
 *       it; it never renders one.
 *
 * WHAT IT WRITES — mechanical reductions, nothing redrawn
 *
 *   apps/web/public/logo.png             Organization logo for JSON-LD: the
 *                                        primary logo, trimmed, small margin,
 *                                        1200 wide, transparent
 *   apps/web/public/favicon.ico          PNG-in-ICO at 16, 32 and 48
 *   apps/web/app/favicon.ico             the same bytes (Next's file convention)
 *   apps/web/public/images/brand/maxpromo-apple-touch-icon.png   180×180
 *   apps/web/public/images/brand/maxpromo-icon-192.png           192×192
 *   apps/web/public/images/brand/maxpromo-icon-512.png           512×512
 *
 * The icon square is lifted off its white canvas: the canvas pixels connected
 * to the edge become transparent, their anti-aliased rim becomes black at
 * partial opacity, so the rounded corners sit cleanly on a dark browser tab as
 * well as a light one. The M inside is enclosed by the black square and is
 * never touched.
 *
 * The app icons live under images/brand/ and not at /apple-touch-icon.png on
 * purpose: iOS requests that root path on its own, and this application also
 * serves the product showcase domains, which have identities of their own.
 * Only the hub's metadata links them (apps/web/app/layout.tsx).
 *
 * This replaced a version that drew a substitute logo, card and favicon from
 * code before the approved masters existed. Re-running it now cannot bring
 * those back: it fails if any master is missing rather than inventing one.
 *
 *   npm run brand:assets
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const ROOT = process.cwd()
const WEB = join(ROOT, 'apps', 'web')
const sharp = createRequire(join(WEB, 'package.json'))('sharp')

const MASTERS = {
  logo: 'apps/web/public/images/brand/maxpromo-digital-logo.png',
  mark: 'apps/web/public/images/brand/maxpromo-mark.png',
  icon: 'apps/web/public/images/brand/maxpromo-icon.png',
  card: 'apps/web/public/images/seo/maxpromo-digital-og.png',
}
const missing = Object.values(MASTERS).filter((p) => !existsSync(join(ROOT, p)))
if (missing.length) {
  console.error('brand:assets: approved master asset(s) missing — nothing derived:')
  for (const p of missing) console.error(`  ${p}`)
  console.error('The masters are supplied by Marcel. This script derives sizes from them and never draws a replacement.')
  process.exit(1)
}

const write = (rel, buf) => {
  writeFileSync(join(ROOT, rel), buf)
  console.log(`brand:assets: ${rel} (${buf.length} bytes)`)
}

/* ── The social card: checked, not made ───────────────────────────────────── */
{
  const m = await sharp(join(ROOT, MASTERS.card)).metadata()
  if (m.width !== 1200 || m.height !== 630) {
    console.error(`brand:assets: ${MASTERS.card} is ${m.width}×${m.height}; the approved card is published at 1200×630.`)
    process.exit(1)
  }
  console.log(`brand:assets: ${MASTERS.card} verified 1200×630 (approved master, unchanged)`)
}

/* ── Organization logo: the primary logo, trimmed and given a margin ───────── */
{
  const trimmed = await sharp(join(ROOT, MASTERS.logo)).trim().png().toBuffer()
  const t = await sharp(trimmed).metadata()
  const pad = Math.round(t.width * 0.04)
  const logo = await sharp(trimmed)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 1200 })
    .png({ compressionLevel: 9 })
    .toBuffer()
  write('apps/web/public/logo.png', logo)
}

/* ── Icon family: the square lifted off its canvas, then reduced ───────────── */
{
  const { data, info } = await sharp(join(ROOT, MASTERS.icon)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const lum = (i) => 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2]

  // The square is the extent of its black body.
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (lum(y * W + x) < 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  }
  const side = Math.max(x1 - x0 + 1, y1 - y0 + 1)
  const cx = Math.round((x0 + x1) / 2), cy = Math.round((y0 + y1) / 2)
  const left = Math.max(0, cx - Math.floor(side / 2)), top = Math.max(0, cy - Math.floor(side / 2))

  // Canvas pixels connected to the edge of the crop become transparent black
  // with alpha from their darkness; the M is enclosed and never reached.
  const S = Math.min(side, W - left, H - top)
  const rgba = Buffer.alloc(S * S * 4)
  const outside = new Uint8Array(S * S)
  const stack = []
  const at = (x, y) => (top + y) * W + (left + x)
  for (let i = 0; i < S; i++) stack.push([i, 0], [i, S - 1], [0, i], [S - 1, i])
  while (stack.length) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= S || y >= S || outside[y * S + x]) continue
    if (lum(at(x, y)) < 24) continue // the black body stops the fill
    outside[y * S + x] = 1
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const o = (y * S + x) * 4, s = at(x, y) * 3
    if (outside[y * S + x]) {
      rgba[o] = 0; rgba[o + 1] = 0; rgba[o + 2] = 0
      rgba[o + 3] = Math.max(0, Math.min(255, Math.round(255 - lum(at(x, y)))))
    } else {
      rgba[o] = data[s]; rgba[o + 1] = data[s + 1]; rgba[o + 2] = data[s + 2]; rgba[o + 3] = 255
    }
  }
  const square = await sharp(rgba, { raw: { width: S, height: S, channels: 4 } }).png().toBuffer()
  const size = (n) => sharp(square).resize(n, n, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer()

  write('apps/web/public/images/brand/maxpromo-apple-touch-icon.png', await size(180))
  write('apps/web/public/images/brand/maxpromo-icon-192.png', await size(192))
  write('apps/web/public/images/brand/maxpromo-icon-512.png', await size(512))

  const sizes = [16, 32, 48]
  const pngs = await Promise.all(sizes.map(size))
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4)
  let offset = 6 + 16 * sizes.length
  const entries = pngs.map((png, i) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(sizes[i], 0); e.writeUInt8(sizes[i], 1)
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12)
    offset += png.length
    return e
  })
  const ico = Buffer.concat([header, ...entries, ...pngs])
  write('apps/web/public/favicon.ico', ico)
  write('apps/web/app/favicon.ico', ico)
}
