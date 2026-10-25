import { and, desc, eq, gte, inArray, isNull, sql as dsql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { agentWork } from "@/lib/db/schema";

// Delegated work (ADR-0030), read for the operator. Always scoped to the
// session's business. A read failure is shown as such by the caller, never as
// an empty, healthy list.

export type WorkItem = typeof agentWork.$inferSelect;

export async function recentWork(businessId: string, limit = 10): Promise<WorkItem[]> {
  if (!isDbConfigured()) return [];
  return getDb().select().from(agentWork)
    .where(eq(agentWork.businessId, businessId))
    .orderBy(desc(agentWork.createdAt))
    .limit(limit);
}

export async function workHealth(businessId: string): Promise<{ failed7d: number; undelivered: number; open: number }> {
  if (!isDbConfigured()) return { failed7d: 0, undelivered: 0, open: 0 };
  const db = getDb();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [failed, undelivered, open] = await Promise.all([
    db.select({ n: dsql<number>`count(*)::int` }).from(agentWork)
      .where(and(eq(agentWork.businessId, businessId), eq(agentWork.state, "failed"), gte(agentWork.createdAt, weekAgo))),
    db.select({ n: dsql<number>`count(*)::int` }).from(agentWork)
      .where(and(eq(agentWork.businessId, businessId), inArray(agentWork.state, ["completed", "failed", "cancelled"]), isNull(agentWork.deliveredAt))),
    db.select({ n: dsql<number>`count(*)::int` }).from(agentWork)
      .where(and(eq(agentWork.businessId, businessId), inArray(agentWork.state, ["queued", "running"]))),
  ]);
  return { failed7d: Number(failed[0]?.n ?? 0), undelivered: Number(undelivered[0]?.n ?? 0), open: Number(open[0]?.n ?? 0) };
}
