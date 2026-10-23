// SERVER-ONLY. The Agent Control Plane's only way into Maxpromo OS (ADR-0021).
//
// The Bureau never reads or writes the OS database. Every business question,
// every enquiry and every requested business action goes through the signed
// door, with the Bureau's own credential, as `bureau:<agent key>`. The OS
// decides what that agent may do; an approval is decided by Marcel in the OS.
//
// Fails closed: without OS_BUREAU_AGENT_SECRET the client reports
// `not_configured` and the caller keeps the work for later. Nothing is
// pretended.

import { AGENT_CONTRACT_VERSION, signedHeaders, type AgentEvent } from "@maxpromo/config/agent-contract";

const DEFAULT_OS_ORIGIN = "https://www.maxpromo.digital";
const TIMEOUT_MS = 15_000;

export type OsResponse =
  | { status: "done"; capability?: string; result?: { summary: string; data?: unknown }; accepted?: number; duplicates?: number }
  | { status: "approval_required"; capability: string; approval: { id: string; summary: string; expiresAt: string } }
  | { status: "refused"; capability?: string; code: string; message: string }
  | { status: "failed"; capability?: string; message: string; retrySafe: boolean };

export type OsCall =
  | { ok: true; response: OsResponse }
  /** The request did not get an OS answer: not configured, rejected at the door, or unreachable. */
  | { ok: false; reason: "not_configured" | "unauthorized" | "unreachable" | "http_error"; status?: number };

export function osConfigured(): boolean {
  return (process.env.OS_BUREAU_AGENT_SECRET?.length ?? 0) >= 32;
}

function origin(): string {
  const raw = process.env.OS_API_ORIGIN?.trim() || DEFAULT_OS_ORIGIN;
  const url = new URL(raw);
  // Only HTTPS to a real host in production; the agent secret never travels in clear.
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("OS_API_ORIGIN must be https");
  return url.origin;
}

async function post(action: "run" | "events" | "capabilities", payload: Record<string, unknown>): Promise<OsCall> {
  const secret = process.env.OS_BUREAU_AGENT_SECRET;
  if (!secret || secret.length < 32) return { ok: false, reason: "not_configured" };
  const path = `/api/os/agent/${AGENT_CONTRACT_VERSION}/${action}`;
  const body = JSON.stringify(payload);
  try {
    const res = await fetch(`${origin()}${path}`, {
      method: "POST",
      headers: signedHeaders({ client: "bureau", secret, method: "POST", path, body }),
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "error",
    });
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "unauthorized", status: res.status };
    if (!res.ok && res.status !== 500) return { ok: false, reason: "http_error", status: res.status };
    return { ok: true, response: (await res.json()) as OsResponse };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

/** Run an OS capability as one of this Bureau's agents. requestId makes a retry safe. */
export function runOsCapability(agent: string, requestId: string, capability: string, input: Record<string, unknown>): Promise<OsCall> {
  return post("run", { requestId, actor: `bureau:${agent}`, channel: "bureau", capability, input });
}

/** Report agent outcomes the owner may need to see in /os. Idempotent by event id. */
export function reportAgentEvents(agent: string, events: AgentEvent[]): Promise<OsCall> {
  return post("events", { actor: `bureau:${agent}`, channel: "bureau", events });
}

/**
 * Which Bureau business is Maxpromo itself (tenant 1). Only that business sees
 * Maxpromo OS state (approvals its agents requested). A client tenant added
 * later is never shown another business's OS.
 */
export function osLinkedBusinessId(): string | null {
  const id = process.env.BUREAU_OS_BUSINESS_ID?.trim();
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id.toLowerCase() : null;
}

/**
 * A request id for a READ. Reads are not retried as the same request, so each
 * page view gets its own id — never one that could collide with an action.
 */
export function readRequestId(view: string): string {
  return `bureau-${view}-${crypto.randomUUID()}`;
}
