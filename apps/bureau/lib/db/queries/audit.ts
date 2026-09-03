import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditSessions, auditFindings } from "@/lib/db/schema";
import { safeRead } from "./_shared";

// Read-only. Latest audit session + findings for the caller's business (Auth-5: session-scoped).
export async function getAuditOverview(businessId: string) {
  return safeRead(
    async () => {
      const db = getDb();
      const [session] = await db
        .select()
        .from(auditSessions)
        .where(eq(auditSessions.businessId, businessId))
        .limit(1);
      if (!session) return { session: null, findings: [] };
      const findings = await db
        .select()
        .from(auditFindings)
        .where(eq(auditFindings.sessionId, session.id));
      return { session, findings };
    },
    {
      session: null as typeof auditSessions.$inferSelect | null,
      findings: [] as (typeof auditFindings.$inferSelect)[],
    },
  );
}
