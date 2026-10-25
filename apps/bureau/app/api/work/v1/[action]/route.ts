import { after, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { siteOrigin } from "@maxpromo/research";
import { WORK_AGENTS, type WorkFailure } from "@maxpromo/config/agent-contract";
import { getDb } from "@/lib/db";
import { agentWork } from "@/lib/db/schema";
import { admitWorkRequest } from "@/lib/work/door";
import { deliverResult, executeResearch, failStale, viewOf } from "@/lib/agents/research";

/**
 * The work door (ADR-0030): Maxpromo OS delegates work to a Bureau agent.
 *
 *   POST /api/work/v1/request   WorkRequest   → 202 { work } queued — or 200 { work } when the id exists
 *   POST /api/work/v1/status    { workId }    → 200 { work } | 404
 *   POST /api/work/v1/cancel    { workId }    → 200 { work } | 404
 *
 * Signed by the OS (lib/work/door.ts). Every lookup is scoped to the caller's
 * tenant; another tenant's work is "not found", never "forbidden". The agent
 * runs after the answer is sent (`after`), within this route's maxDuration.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Reading a site (≤ 4 pages × 8 s) and one model step through the OS (≤ 90 s). */
export const maxDuration = 300;

const ACTIONS = new Set(["request", "status", "cancel"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTOR = /^os:[a-z0-9][a-z0-9-]{1,40}$/;
const SOURCE = /^[a-z][a-z0-9-]{1,30}$/;

const err = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  if (!ACTIONS.has(action)) return err("not_found", 404);
  const rawBody = await request.text();
  if (rawBody.length > 16 * 1024) return err("too_large", 413);

  const gate = await admitWorkRequest({ headers: request.headers, method: "POST", path: new URL(request.url).pathname, rawBody });
  if (!gate.ok) return err(gate.error, gate.status);
  const { businessId, body } = gate;
  const db = getDb();

  try {
    if (action === "request") {
      const parsed = parseRequest(body);
      if (!parsed.ok) return err(parsed.error, 400);
      const r = parsed.value;
      const inserted = await db.insert(agentWork).values({
        id: r.workId, businessId, agentKey: r.agent, capability: WORK_AGENTS[r.agent].capability,
        requestedBy: r.requestedBy, source: r.source, subjectKind: "lead", subjectId: r.subjectId, subjectLabel: r.subjectLabel,
        input: { website: r.website, ...(r.language ? { language: r.language } : {}) }, objective: r.objective,
      }).onConflictDoNothing().returning();
      if (!inserted[0]) {
        // The same work id again: the item that exists, never a second execution.
        const existing = await db.select().from(agentWork).where(and(eq(agentWork.id, r.workId), eq(agentWork.businessId, businessId)));
        return existing[0] ? NextResponse.json({ work: viewOf(existing[0]), duplicate: true }) : err("not_found", 404);
      }
      after(async () => { await executeResearch(r.workId); });
      return NextResponse.json({ work: viewOf(inserted[0]) }, { status: 202 });
    }

    const workId = typeof body.workId === "string" && UUID.test(body.workId) ? body.workId.toLowerCase() : null;
    if (!workId) return err("workId is required", 400);
    if (action === "status") await failStale(businessId);
    const rows = await db.select().from(agentWork).where(and(eq(agentWork.id, workId), eq(agentWork.businessId, businessId)));
    if (!rows[0]) return err("not_found", 404);
    if (action === "status") return NextResponse.json({ work: viewOf(rows[0]) });

    const cancelled = await db.update(agentWork).set({
      state: "cancelled", finishedAt: new Date(),
      failure: { category: "cancelled", reason: "owner", detail: "Cancelled from Maxpromo OS.", retryable: true } satisfies WorkFailure,
    }).where(and(eq(agentWork.id, workId), eq(agentWork.businessId, businessId), inArray(agentWork.state, ["queued", "running"]))).returning();
    if (cancelled[0]) after(async () => { await deliverResult(cancelled[0]); });
    return NextResponse.json({ work: viewOf(cancelled[0] ?? rows[0]) });
  } catch (e) {
    console.error("[work-door]", action, e instanceof Error ? e.message : e);
    return err("failed", 500);
  }
}

type Parsed = { workId: string; agent: "research"; requestedBy: string; source: string; subjectId: string; subjectLabel: string; website: string; language?: "de" | "en"; objective: string };

/** A work request exactly as the contract says, or a named refusal. Unknown agents are refused. */
function parseRequest(b: Record<string, unknown>): { ok: true; value: Parsed } | { ok: false; error: string } {
  const subject = (b.subject ?? {}) as Record<string, unknown>;
  const input = (b.input ?? {}) as Record<string, unknown>;
  const constraints = (b.constraints ?? {}) as Record<string, unknown>;
  if (typeof b.workId !== "string" || !UUID.test(b.workId)) return { ok: false, error: "workId must be a uuid" };
  if (b.agent !== "research") return { ok: false, error: "unknown_agent" };
  if (typeof b.requestedBy !== "string" || !ACTOR.test(b.requestedBy)) return { ok: false, error: "requestedBy must be an OS actor" };
  if (typeof b.source !== "string" || !SOURCE.test(b.source)) return { ok: false, error: "source is invalid" };
  if (subject.kind !== "lead" || typeof subject.id !== "string" || !UUID.test(subject.id)) return { ok: false, error: "subject must be a lead reference" };
  const label = typeof subject.label === "string" ? subject.label.trim().slice(0, 200) : "";
  const website = typeof input.website === "string" ? input.website.trim() : "";
  if (!website || website.length > 300 || !siteOrigin(website)) return { ok: false, error: "input.website must be a public website address" };
  if (constraints.publicWebsiteOnly !== true || constraints.sendsNothing !== true) return { ok: false, error: "constraints are required" };
  const objective = typeof b.objective === "string" ? b.objective.trim().slice(0, 500) : "";
  if (!objective) return { ok: false, error: "objective is required" };
  const language = input.language === "de" || input.language === "en" ? input.language : undefined;
  return { ok: true, value: { workId: b.workId.toLowerCase(), agent: "research", requestedBy: b.requestedBy, source: b.source, subjectId: subject.id.toLowerCase(), subjectLabel: label || "Lead", website, language, objective } };
}
