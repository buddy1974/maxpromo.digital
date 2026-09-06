import { neon } from '@neondatabase/serverless'

export function getDb() {
  if (!(process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL)) {
    throw new Error('[db] DATABASE_URL is not configured')
  }
  return neon(process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL as string)
}
