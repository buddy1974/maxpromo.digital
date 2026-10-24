import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * The one check for Vercel cron routes: Vercel sends `Authorization: Bearer <CRON_SECRET>`. Without
 * a configured secret (16+ characters) every request is refused — cron routes fail closed.
 */
export function cronAuthorized(header: string | null, secret: string | undefined = process.env.CRON_SECRET): boolean {
  if (!secret || secret.length < 16 || !header?.startsWith('Bearer ')) return false
  const digest = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(digest(header.slice(7)), digest(secret))
}
