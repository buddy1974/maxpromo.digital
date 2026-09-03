import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  aiToolRegister,
  aiGovernanceRisks,
  aiPolicyChecklists,
} from "@/lib/db/schema";
import { safeRead } from "./_shared";

export interface GovernanceData {
  tools: (typeof aiToolRegister.$inferSelect)[];
  risks: (typeof aiGovernanceRisks.$inferSelect)[];
  policy: (typeof aiPolicyChecklists.$inferSelect)[];
}

// Read-only. Governance assessment data for the caller's business (Auth-5: session-scoped).
export async function getGovernance(businessId: string): Promise<GovernanceData> {
  return safeRead(
    async () => {
      const db = getDb();
      const [tools, risks, policy] = await Promise.all([
        db.select().from(aiToolRegister).where(eq(aiToolRegister.businessId, businessId)),
        db.select().from(aiGovernanceRisks).where(eq(aiGovernanceRisks.businessId, businessId)),
        db.select().from(aiPolicyChecklists).where(eq(aiPolicyChecklists.businessId, businessId)),
      ]);
      return { tools, risks, policy };
    },
    { tools: [], risks: [], policy: [] },
  );
}
