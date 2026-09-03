import { sql, eq } from "drizzle-orm";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getDb } from "@/lib/db";
import {
  agents,
  agentProposals,
  waitingRoomItems,
  documentIntakeItems,
  playbooks,
  activityLogs,
} from "@/lib/db/schema";
import { safeRead } from "@/lib/db/queries/_shared";

// Read-only demo workspace status. GET only — no writes, no reset, no delete.
// Auth-3: owner/operator role required (internal tooling).
// Auth-5: businessId sourced from session — no global demo lookup.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  // Only owner and operator roles can view workspace status.
  if (auth.user.role !== "owner" && auth.user.role !== "operator") {
    return apiError("forbidden", 403);
  }

  // Auth-5: use session businessId directly — no getDemoBusinessId() lookup.
  const businessId = auth.user.businessId;

  const data = await safeRead(
    async () => {
      const db = getDb();
      const n = sql<number>`count(*)::int`;
      const [a, p, w, d, pb, act] = await Promise.all([
        db.select({ n }).from(agents).where(eq(agents.businessId, businessId)),
        db.select({ n }).from(agentProposals).where(eq(agentProposals.businessId, businessId)),
        db.select({ n }).from(waitingRoomItems).where(eq(waitingRoomItems.businessId, businessId)),
        db.select({ n }).from(documentIntakeItems).where(eq(documentIntakeItems.businessId, businessId)),
        db.select({ n }).from(playbooks).where(eq(playbooks.businessId, businessId)),
        db.select({ n }).from(activityLogs).where(eq(activityLogs.businessId, businessId)),
      ]);
      return {
        businessExists: true,
        agents: a[0]?.n ?? 0,
        proposals: p[0]?.n ?? 0,
        waitingRoom: w[0]?.n ?? 0,
        documents: d[0]?.n ?? 0,
        playbooks: pb[0]?.n ?? 0,
        activityLogs: act[0]?.n ?? 0,
      };
    },
    {
      businessExists: false,
      agents: 0,
      proposals: 0,
      waitingRoom: 0,
      documents: 0,
      playbooks: 0,
      activityLogs: 0,
    },
  );
  return apiOk(data);
}
