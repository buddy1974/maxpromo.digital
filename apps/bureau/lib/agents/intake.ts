// SERVER-ONLY. The Intake agent (ADR-0021) — the first Max Agent with a real runtime.
//
// What it is: a registered agent identity (`bureau:intake`) whose one job is to
// hand an enquiry captured on this site to Maxpromo OS through `lead.intake`.
// Deterministic: no model, no tool beyond that one capability.
//
// What it owns: its run (agent_runs) and the outbox row while the OS does not
// yet have the enquiry. What it does not own: the lead. Once the OS confirms,
// the outbox row is deleted; the lead lives only in the OS.
//
// Failure: the row stays, the run is recorded as failed with the reason, and —
// when the OS answered but refused — a failure event is reported to /os so
// Marcel sees it there. An unreachable OS is retried on the next submission,
// on the scheduled flush and whenever an operator opens the dashboard.

import { and, asc, eq, lt, sql as dsql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agentRuns, leadSubmissions } from "@/lib/db/schema";
import { osLinkedBusinessId, reportAgentEvents, runOsCapability } from "@/lib/os/client";

export const INTAKE_AGENT = "intake";
const SOURCE = "agent_bureau_form";
/** After this many failures the row is left for a human; it is never dropped. */
const MAX_AUTOMATIC_ATTEMPTS = 20;

export type IntakeOutcome =
  | { forwarded: true; leadId: string; outcome: "created" | "matched" | "duplicate" }
  | { forwarded: false; reason: string };

type Submission = typeof leadSubmissions.$inferSelect;

async function recordRun(status: string, input: unknown, output: unknown) {
  const businessId = osLinkedBusinessId();
  if (!businessId) return; // A run belongs to a tenant; without the link there is no tenant to record it under.
  try {
    await getDb().insert(agentRuns).values({
      businessId, agentKey: INTAKE_AGENT, trigger: "webhook", input, output, status, finishedAt: new Date(),
    });
  } catch (err) {
    console.error("[intake] could not record the run:", err instanceof Error ? err.message : err);
  }
}

export async function forwardSubmission(s: Submission): Promise<IntakeOutcome> {
  const call = await runOsCapability(INTAKE_AGENT, `bureau-intake-${s.id}`, "lead.intake", {
    source: SOURCE,
    external_ref: s.id,
    received_at: s.createdAt.toISOString(),
    name: s.name,
    email: s.email,
    phone: s.phone ?? undefined,
    company: s.company ?? undefined,
    message: s.message ?? undefined,
    interest: s.ctaType,
  });

  if (call.ok && call.response.status === "done") {
    const data = (call.response.result?.data ?? {}) as { lead_id?: string; outcome?: "created" | "matched"; duplicate?: boolean };
    if (data.lead_id) {
      // The OS has it. The Bureau keeps no copy of the enquiry.
      await getDb().delete(leadSubmissions).where(eq(leadSubmissions.id, s.id));
      const outcome = data.duplicate ? "duplicate" : (data.outcome ?? "created");
      await recordRun("completed", { submission: s.id }, { os_lead_id: data.lead_id, outcome });
      return { forwarded: true, leadId: data.lead_id, outcome };
    }
  }

  const reason = call.ok
    ? `${call.response.status}${"code" in call.response ? `:${call.response.code}` : ""}`
    : call.reason;
  await getDb().update(leadSubmissions).set({
    forwardAttempts: dsql`${leadSubmissions.forwardAttempts} + 1`,
    lastForwardAt: new Date(),
    lastForwardError: reason.slice(0, 200),
  }).where(eq(leadSubmissions.id, s.id));
  await recordRun("failed", { submission: s.id }, { reason });

  // The OS answered and said no: that needs a person, and the person looks at /os.
  if (call.ok) {
    await reportAgentEvents(INTAKE_AGENT, [{
      id: `intake-failed-${s.id}-${s.forwardAttempts + 1}`,
      kind: "failed",
      severity: "warning",
      title: "An enquiry from the Agent Bureau site could not be recorded in Maxpromo OS",
      detail: `The OS answered ${reason}. The enquiry is kept in the Bureau outbox and retried.`,
      runId: `bureau-intake-${s.id}`,
      occurredAt: new Date().toISOString(),
    }]);
  }
  return { forwarded: false, reason };
}

/** Retry what is still waiting, oldest first. Bounded so a request never waits long. */
export async function flushIntakeOutbox(limit = 5): Promise<{ attempted: number; forwarded: number }> {
  const pending = await getDb().select().from(leadSubmissions)
    .where(and(lt(leadSubmissions.forwardAttempts, MAX_AUTOMATIC_ATTEMPTS)))
    .orderBy(asc(leadSubmissions.createdAt))
    .limit(limit);
  let forwarded = 0;
  for (const s of pending) {
    if ((await forwardSubmission(s)).forwarded) forwarded++;
  }
  return { attempted: pending.length, forwarded };
}

/** What the dashboard shows about this agent: is anything stuck? */
export async function intakeOutboxState(): Promise<{ waiting: number; oldest: Date | null; lastError: string | null }> {
  const rows = await getDb().select({
    waiting: dsql<number>`count(*)::int`,
    oldest: dsql<Date | null>`min(${leadSubmissions.createdAt})`,
    lastError: dsql<string | null>`(array_agg(${leadSubmissions.lastForwardError} ORDER BY ${leadSubmissions.lastForwardAt} DESC NULLS LAST))[1]`,
  }).from(leadSubmissions);
  const r = rows[0];
  return { waiting: Number(r?.waiting ?? 0), oldest: r?.oldest ? new Date(r.oldest) : null, lastError: r?.lastError ?? null };
}

/** The intake agent's latest recorded runs for a tenant, newest first. */
export async function recentIntakeRuns(businessId: string, limit = 5) {
  return getDb().select({ id: agentRuns.id, status: agentRuns.status, output: agentRuns.output, finishedAt: agentRuns.finishedAt })
    .from(agentRuns)
    .where(and(eq(agentRuns.businessId, businessId), eq(agentRuns.agentKey, INTAKE_AGENT)))
    .orderBy(dsql`${agentRuns.startedAt} DESC`)
    .limit(limit);
}
