import { token } from '@maxpromo/design-tokens'
/**
 * components/documents/MomoQrCode.tsx
 *
 * Renders the MTN MoMo payment QR code as an inline SVG, generated at
 * render time from the payment URL in lib/documents/config.ts.
 *
 * Deliberately NOT a static image: `QRCode.create()` from the `qrcode`
 * package is synchronous, so the code is available on the very first
 * render (no async/useEffect race with the print page's auto-fired
 * `window.print()`), and an SVG built from the raw module matrix is
 * vector — it stays perfectly crisp at any print DPI, unlike a
 * screenshotted/rasterised QR that can blur or degrade when Chrome
 * scales it for an A4 page.
 */

import QRCode from 'qrcode'

interface MomoQrCodeProps {
  /** The exact data the QR code encodes (a MoMo payment request URL). */
  value: string
  /** Rendered size in px (also used as the SVG viewBox / print size). */
  size?: number
  /** Quiet-zone modules around the code — keep >= 2 for reliable scanning. */
  margin?: number
}

export function MomoQrCode({ value, size = 120, margin = 2 }: MomoQrCodeProps) {
  // High error correction ('H', ~30% recoverable) — this QR sits inside a
  // printed document that gets folded, photocopied and scanned; a higher
  // correction level keeps it scannable even if a corner is creased or a
  // print head is under-inked.
  const qr = QRCode.create(value, { errorCorrectionLevel: 'H' })
  const modules = qr.modules
  const moduleCount = modules.size
  const cell = size / (moduleCount + margin * 2)

  const rects: string[] = []
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.get(row, col)) {
        const x = (col + margin) * cell
        const y = (row + margin) * cell
        rects.push(`M${x},${y}h${cell}v${cell}h${-cell}z`)
      }
    }
  }

  return (
    <svg
      role="img"
      aria-label="MTN Mobile Money payment QR code"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', background: token.surface }}
    >
      <rect x={0} y={0} width={size} height={size} fill={token.surface} />
      <path d={rects.join(' ')} fill={token.text} />
    </svg>
  )
}
