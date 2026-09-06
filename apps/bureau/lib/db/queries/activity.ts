import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { safeRead } from "./_shared";

// Read-only. Most recent activity for the caller's business (Auth-5: session-scoped).
export async function getActivity(businessId: string, limit = 20) {
  return safeRead(async () => {
    const db = getDb();
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.businessId, businessId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }, [] as (typeof activityLogs.$inferSelect)[]);
}

// ── Write helper ─────────────────────────────────────────────────────────────
// Records a single activity-log entry. Used by the approval workflow. Errors
// propagate (no safeRead) so the caller can decide how to handle them.
export interface ActivityLogInput {
  businessId: string;
  actor: "user" | "agent" | "system";
  actorName: string;
  action: string;
  target?: string | null;
  detail?: string | null;
}

export async function createActivityLog(input: ActivityLogInput) {
  const db = getDb();
  const [row] = await db
    .insert(activityLogs)
    .values({
      businessId: input.businessId,
      actor: input.actor,
      actorName: input.actorName,
      action: input.action,
      target: input.target ?? null,
      detail: input.detail ?? null,
    })
    .returning();
  return row;
}
