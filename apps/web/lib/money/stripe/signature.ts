/**
 * Stripe webhook signature verification (ADR-0025). Pure; no SDK.
 *
 * Stripe signs `${t}.${rawBody}` with HMAC-SHA256 under the endpoint's signing secret and sends
 * `Stripe-Signature: t=<unix>,v1=<hex>[,v1=<hex>…]`. An event is accepted only when:
 *   - the header parses and carries a timestamp and at least one v1 signature;
 *   - the timestamp is within the tolerance in BOTH directions (a replayed old event and a
 *     forged future one are refused alike);
 *   - some v1 signature matches some configured secret, compared in constant time.
 * Several secrets are accepted so an endpoint secret can be rolled without downtime.
 * The raw body is verified byte-for-byte: it must not be parsed and re-serialised first.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export const SIGNATURE_TOLERANCE_SECONDS = 300

export type SignatureProblem = 'missing_header' | 'malformed_header' | 'stale_timestamp' | 'no_secret' | 'mismatch'

export function parseSignatureHeader(header: string | null): { t: number; v1: string[] } | null {
  if (!header || header.length > 2048) return null
  let t: number | null = null
  const v1: string[] = []
  for (const part of header.split(',')) {
    const i = part.indexOf('=')
    if (i < 1) continue
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim()
    if (k === 't' && /^\d{9,11}$/.test(v)) t = Number(v)
    else if (k === 'v1' && /^[0-9a-f]{64}$/.test(v)) v1.push(v)
  }
  return t !== null && v1.length ? { t, v1 } : null
}

/** Secrets from `STRIPE_WEBHOOK_SECRET`, comma-separated for rotation. */
export function webhookSecrets(value: string | undefined): string[] {
  return (value ?? '').split(',').map(s => s.trim()).filter(s => /^whsec_[A-Za-z0-9+/=]{16,}$/.test(s))
}

export function verifyStripeSignature(rawBody: string, header: string | null, secrets: readonly string[], nowSeconds: number,
  tolerance = SIGNATURE_TOLERANCE_SECONDS): { ok: true; timestamp: number } | { ok: false; problem: SignatureProblem } {
  if (!secrets.length) return { ok: false, problem: 'no_secret' }
  if (!header) return { ok: false, problem: 'missing_header' }
  const parsed = parseSignatureHeader(header)
  if (!parsed) return { ok: false, problem: 'malformed_header' }
  if (Math.abs(nowSeconds - parsed.t) > tolerance) return { ok: false, problem: 'stale_timestamp' }
  const signed = `${parsed.t}.${rawBody}`
  for (const secret of secrets) {
    const expected = createHmac('sha256', secret).update(signed, 'utf8').digest()
    for (const candidate of parsed.v1) {
      const given = Buffer.from(candidate, 'hex')
      if (given.length === expected.length && timingSafeEqual(given, expected)) return { ok: true, timestamp: parsed.t }
    }
  }
  return { ok: false, problem: 'mismatch' }
}

/** Test helper and documentation of the scheme: the header Stripe would send for this body. */
export function signStripePayload(rawBody: string, secret: string, timestamp: number): string {
  return `t=${timestamp},v1=${createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex')}`
}
