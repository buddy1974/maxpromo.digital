import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Why a getter, not a top-level client: the app must build/deploy even before
// DATABASE_URL is set (e.g. first Vercel import). We fail loudly only when a
// request actually needs the DB — never silently, never with fake data.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Lead capture requires a Neon connection string.",
    );
  }
  if (!_db) {
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export { schema };
