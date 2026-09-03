import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { DEMO_BUSINESS_NAME } from "@/config/demo";

/**
 * Resilience contract for the whole read layer: dashboard pages are
 * `force-dynamic`, but `next build` (and any environment without a DB) must not
 * crash. Every query helper runs through `safeRead`, which returns a fallback
 * on missing config OR any error — yielding clean empty states instead of 500s.
 */
export async function safeRead<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!isDbConfigured()) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.error("[db/queries] read failed:", err);
    return fallback;
  }
}

/** Resolve the demo workspace id by stable name. Null if absent/unseeded. */
export async function getDemoBusinessId(): Promise<string | null> {
  return safeRead(async () => {
    const db = getDb();
    const [row] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.name, DEMO_BUSINESS_NAME))
      .limit(1);
    return row?.id ?? null;
  }, null);
}
