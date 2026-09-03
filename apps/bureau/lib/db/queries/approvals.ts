import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agentProposals, approvalEvents } from "@/lib/db/schema";
import type { ApprovalStatus } from "@/types/agent";
import type { ApprovalEventInput } from "@/types/approval";
import { safeRead } from "./_shared";

// Read-only. Pending agent proposals for the caller's business (Auth-5: session-scoped).
export async function getProposals(businessId: string) {
  return safeRead(async () => {
    const db = getDb();
    return db
      .select()
      .from(agentProposals)
      .where(eq(agentProposals.businessId, businessId));
  }, [] as (typeof agentProposals.$inferSelect)[]);
}

// ── Write helpers ─────────────────────────────────────────────────────────────
// These run inside the PATCH route and intentionally do NOT use safeRead — real
// errors must surface to the API so failures aren't masked as success.

export async function getProposalById(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(agentProposals)
    .where(eq(agentProposals.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateProposalStatus(id: string, status: ApprovalStatus) {
  const db = getDb();
  const [row] = await db
    .update(agentProposals)
    .set({ status })
    .where(eq(agentProposals.id, id))
    .returning();
  return row ?? null;
}

export async function createApprovalEvent(input: ApprovalEventInput) {
  const db = getDb();
  const [row] = await db
    .insert(approvalEvents)
    .values({
      businessId: input.businessId,
      proposalId: input.proposalId,
      step: input.step,
      actor: input.actor,
      note: input.note ?? null,
    })
    .returning();
  return row;
}

export async function getApprovalEventsForProposal(proposalId: string) {
  const db = getDb();
  return db
    .select()
    .from(approvalEvents)
    .where(eq(approvalEvents.proposalId, proposalId))
    .orderBy(asc(approvalEvents.createdAt));
}
