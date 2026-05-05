/**
 * lib/env.ts
 *
 * Runtime environment validation. Imported once at boot from key
 * server-side modules so missing required vars surface as a clear error
 * instead of mysterious 500s deep inside route handlers.
 *
 * No new dependency — we do our own validation. If the project ever
 * adds Zod we should swap this for `@t3-oss/env-nextjs`.
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   const url = env.NEON_DATABASE_URL
 *
 * The `env` object is built lazily so build-time imports of unrelated
 * modules don't crash when a var is missing.
 */

type EnvShape = {
  // Database
  NEON_DATABASE_URL: string

  // Anthropic / OpenAI — optional but at least one should be set in prod
  ANTHROPIC_API_KEY?: string
  OPENAI_API_KEY?: string

  // Email (Resend)
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string
  CONTACT_EMAIL?: string

  // Auth
  OS_PASSWORD: string
  OS_SESSION_SECRET: string

  // Portfolio gate (existing)
  PORTFOLIO_PASSWORD?: string

  // Node
  NODE_ENV: 'development' | 'test' | 'production'
}

class EnvError extends Error {
  constructor(message: string) {
    super(`[env] ${message}`)
    this.name = 'EnvError'
  }
}

function read(name: keyof EnvShape, opts: { required?: boolean; minLength?: number } = {}): string | undefined {
  const raw = process.env[name as string]
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) {
    if (opts.required) {
      throw new EnvError(
        `${name} is required. Set it in .env.local (dev) or Vercel Project Settings (prod).`,
      )
    }
    return undefined
  }
  if (opts.minLength && value.length < opts.minLength) {
    throw new EnvError(
      `${name} must be at least ${opts.minLength} characters long.`,
    )
  }
  return value
}

let cached: EnvShape | null = null

function build(): EnvShape {
  // NEON_DATABASE_URL or DATABASE_URL — prefer the explicit one.
  const dbUrl =
    process.env.NEON_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim()
  if (!dbUrl) {
    throw new EnvError(
      'NEON_DATABASE_URL (or DATABASE_URL) is required. Set the Neon serverless connection string.',
    )
  }

  const osPassword = read('OS_PASSWORD', { required: true, minLength: 8 })
  const osSessionSecret = read('OS_SESSION_SECRET', { required: true, minLength: 32 })

  // At least one AI provider in production.
  const anthropic = read('ANTHROPIC_API_KEY')
  const openai = read('OPENAI_API_KEY')
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as EnvShape['NODE_ENV']
  if (nodeEnv === 'production' && !anthropic && !openai) {
    throw new EnvError(
      'At least one of ANTHROPIC_API_KEY or OPENAI_API_KEY must be set in production.',
    )
  }

  return {
    NEON_DATABASE_URL: dbUrl,
    ANTHROPIC_API_KEY: anthropic,
    OPENAI_API_KEY: openai,
    RESEND_API_KEY: read('RESEND_API_KEY'),
    RESEND_FROM_EMAIL: read('RESEND_FROM_EMAIL'),
    CONTACT_EMAIL: read('CONTACT_EMAIL'),
    OS_PASSWORD: osPassword!,
    OS_SESSION_SECRET: osSessionSecret!,
    PORTFOLIO_PASSWORD: read('PORTFOLIO_PASSWORD'),
    NODE_ENV: nodeEnv,
  }
}

/**
 * Lazy proxy. The first property access materialises the validated env.
 * Modules that only need *some* keys won't crash if unrelated keys aren't
 * set — but they will crash for the keys they actually use, with a
 * descriptive error.
 */
export const env: EnvShape = new Proxy({} as EnvShape, {
  get(_target, prop: string) {
    if (!cached) cached = build()
    return cached[prop as keyof EnvShape]
  },
})
