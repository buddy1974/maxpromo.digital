// SERVER-ONLY. The Research Agent (ADR-0030) — the Bureau's first agent that does specialist work.
//
// Trigger: work delegated by Maxpromo OS through the work door (lib/work/door.ts),
//          one item per lead, idempotent by the OS's work id.
// Input:   a bounded snapshot — the business's website. Never the lead record.
// Tools:   one — reading that public website (@maxpromo/research fetchSite: public hosts
//          only, private and link-local addresses refused, every redirect re-checked,
//          robots.txt, size and time limits, HTML only).
// Model:   one registered task, "lead.research", run by the OS gateway on request
//          (runOsModelTask). The Bureau holds no model key and cannot change the prompt.
// Output:  verified findings (quotes that are really on the cited page), the code-made
//          qualification and recommendation — handed back through agentwork.result.
//          The OS re-scores with the same rules and owns what it writes to the lead.
// State:   agent_work (the unit), agent_runs (each execution).
// Acts on: nothing. It sends no email and changes no business record itself.
//
// Failure is a state, not a warning: site unreachable, robots, not HTML, model
// unavailable — each becomes `failed` with a category Marcel can act on.

import { and, eq, inArray, isNull, lt, sql as dsql } from "drizzle-orm";
import { researchSite, researchWorkResult, type ResearchDeps } from "@maxpromo/research";
import type { JsonResult } from "@maxpromo/ai";
import type { WorkFailure, WorkView } from "@maxpromo/config/agent-contract";
import { getDb } from "@/lib/db";
import { agentRuns, agentWork } from "@/lib/db/schema";
import { runOsCapability, runOsModelTask } from "@/lib/os/client";

export const RESEARCH_AGENT = "research";
/** Work running longer than this died with its function (deploy, platform limit). */
export const STALE_RUNNING_MINUTES = 10;

type WorkRow = typeof agentWork.$inferSelect;

export function viewOf(w: WorkRow): WorkView {
  return {
    workId: w.id,
    agent: "research",
    state: w.state as WorkView["state"],
    createdAt: w.createdAt.toISOString(),
    startedAt: w.startedAt?.toISOString() ?? null,
    finishedAt: w.finishedAt?.toISOString() ?? null,
    ...(w.state === "completed" && w.result ? { result: w.result } : {}),
    ...(w.failure ? { failure: w.failure as WorkFailure } : {}),
    runtime: { model: w.model, latencyMs: w.latencyMs, attempt: Math.max(1, w.attempt) },
  };
}

/** The model step through the OS gateway, in the gateway's own result shape. */
export async function completeThroughOs(content: string): Promise<JsonResult> {
  const call = await runOsModelTask(RESEARCH_AGENT, "lead.research", content);
  if (call.ok && call.response.status === "done" && "task" in call.response) {
    return { ok: true, data: call.response.data, model: call.response.model, route: "anthropic" };
  }
  const klass = call.ok && call.response.status === "failed" && "klass" in call.response ? call.response.klass : "PROVIDER";
  return { ok: false, failure: { klass: klass as never, status: 503, logDetail: call.ok ? `os model door: ${call.response.status}` : `os model door: ${call.reason}` } };
}

/** Site failures that will not change by trying again soon. */
const PERMANENT_SITE = new Set(["invalid_url", "blocked_host", "robots", "not_html"]);

export interface ExecuteDeps extends ResearchDeps {
  /** Hands the finished item to the OS. Default: agentwork.result through the OS door. */
  deliver?: (view: WorkView) => Promise<{ ok: boolean; error?: string }>;
}

/**
 * Execute one queued item. Claims it (queued → running) with one conditional UPDATE, so a
 * repeated trigger runs it once. Never throws: every outcome ends as a recorded state.
 */
export async function executeResearch(workId: string, deps: ExecuteDeps = {}): Promise<WorkRow | null> {
  const db = getDb();
  const claimed = await db.update(agentWork)
    .set({ state: "running", startedAt: new Date(), attempt: dsql`${agentWork.attempt} + 1` })
    .where(and(eq(agentWork.id, workId), eq(agentWork.state, "queued")))
    .returning();
  const w = claimed[0];
  if (!w) return null;
  const started = Date.now();
  const [run] = await db.insert(agentRuns).values({
    businessId: w.businessId, agentKey: RESEARCH_AGENT, trigger: "os", input: { work_id: w.id, subject: w.subjectId }, status: "running",
  }).returning({ id: agentRuns.id });

  let modelMs: number | null = null;
  let finished: Partial<WorkRow>;
  try {
    const website = (w.input as { website?: string }).website ?? "";
    const outcome = await researchSite(website, {
      ...deps,
      complete: deps.complete ?? (async (req) => {
        const t = Date.now();
        const content = typeof req.messages[0]?.content === "string" ? req.messages[0].content : "";
        const r = await completeThroughOs(content);
        modelMs = Date.now() - t;
        return r;
      }),
    });
    if (outcome.ok) {
      finished = { state: "completed", result: researchWorkResult(outcome.findings), failure: null, model: outcome.findings.model };
    } else {
      const failure: WorkFailure = {
        category: outcome.stage === "site" ? "site" : "model",
        reason: outcome.reason,
        detail: outcome.detail,
        retryable: outcome.stage === "model" ? outcome.reason !== "CONFIGURATION" : !PERMANENT_SITE.has(outcome.reason),
      };
      finished = { state: "failed", failure };
    }
  } catch (err) {
    console.error("[research-agent] execution error:", err instanceof Error ? err.message : err);
    finished = { state: "failed", failure: { category: "internal", reason: "exception", detail: "The Research Agent stopped on an internal error.", retryable: true } satisfies WorkFailure };
  }

  // Only a still-running item takes the outcome: a cancellation in the meantime stands.
  const done = await db.update(agentWork)
    .set({ ...finished, finishedAt: new Date(), latencyMs: modelMs ?? Date.now() - started })
    .where(and(eq(agentWork.id, w.id), eq(agentWork.state, "running")))
    .returning();
  await db.update(agentRuns).set({
    status: finished.state === "completed" ? "completed" : "failed",
    output: finished.state === "completed"
      ? { work_id: w.id, score: (finished.result as { qualification?: { score?: number } })?.qualification?.score ?? null }
      : { work_id: w.id, failure: finished.failure },
    finishedAt: new Date(),
  }).where(eq(agentRuns.id, run.id));
  const final = done[0] ?? (await db.select().from(agentWork).where(eq(agentWork.id, w.id)))[0];
  if (final) await deliverResult(final, deps.deliver);
  return final ?? null;
}

/** Hand a terminal item to the OS once; a failed hand-back is kept and retried. */
export async function deliverResult(w: WorkRow, deliver?: ExecuteDeps["deliver"]): Promise<boolean> {
  if (!["completed", "failed", "cancelled"].includes(w.state) || w.deliveredAt) return Boolean(w.deliveredAt);
  const view = viewOf(w);
  const out = deliver ? await deliver(view) : await (async () => {
    // One request id per item: a retried hand-back gets the OS's stored answer.
    const call = await runOsCapability(RESEARCH_AGENT, `bureau-work-result-${w.id}`, "agentwork.result", { work: view });
    if (call.ok && call.response.status === "done") return { ok: true };
    return { ok: false, error: call.ok ? `${call.response.status}${"code" in call.response ? `:${call.response.code}` : ""}` : call.reason };
  })();
  await getDb().update(agentWork)
    .set(out.ok ? { deliveredAt: new Date(), deliveryError: null } : { deliveryError: (out.error ?? "unknown").slice(0, 200) })
    .where(eq(agentWork.id, w.id));
  return out.ok;
}

/**
 * Running past its deadline means the function died: fail it honestly (the OS is told on its
 * next look or by the result hand-back). Queued items that never started fail the same way.
 */
export async function failStale(businessId?: string): Promise<number> {
  const cutoff = dsql`now() - make_interval(mins => ${STALE_RUNNING_MINUTES})`;
  const rows = await getDb().update(agentWork).set({
    state: "failed", finishedAt: new Date(),
    failure: { category: "timeout", reason: "stale", detail: "The work stopped without finishing (the run ended before a result).", retryable: true } satisfies WorkFailure,
  }).where(and(
    inArray(agentWork.state, ["running", "queued"]),
    dsql`coalesce(${agentWork.startedAt}, ${agentWork.createdAt}) < ${cutoff}`,
    businessId ? eq(agentWork.businessId, businessId) : undefined,
  )).returning();
  for (const r of rows) await deliverResult(r);
  return rows.length;
}

/** Terminal items whose hand-back failed: try again (cron, dashboard view). */
export async function redeliverPending(limit = 10): Promise<number> {
  const rows = await getDb().select().from(agentWork)
    .where(and(inArray(agentWork.state, ["completed", "failed", "cancelled"]), isNull(agentWork.deliveredAt), lt(agentWork.finishedAt, new Date(Date.now() - 30_000))))
    .limit(limit);
  let n = 0;
  for (const r of rows) if (await deliverResult(r)) n++;
  return n;
}
