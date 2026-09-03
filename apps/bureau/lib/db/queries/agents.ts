import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { safeRead } from "./_shared";

// Read-only. Agents for the caller's business (Auth-5: session-scoped).
export async function getAgents(businessId: string) {
  return safeRead(async () => {
    const db = getDb();
    return db.select().from(agents).where(eq(agents.businessId, businessId));
  }, [] as (typeof agents.$inferSelect)[]);
}
