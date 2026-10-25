// SERVER-ONLY. The work door (ADR-0030): the one way Maxpromo OS delegates work to this Bureau.
//
// The mirror of the OS door (`/api/os/agent/v1`), with the same signing code from
// @maxpromo/config/agent-contract and its own key (workDoorSecret: BUREAU_WORK_SECRET, or a key
// derived from the shared Bureau credential for this purpose only):
//
//   1. the caller names client `os`; the key is configured and is not the
//      Bureau's own OS credential itself (one key per direction, or 503);
//   2. the signature covers timestamp, nonce, method, path and the exact body;
//   3. the nonce has never been seen (work_nonces, primary key) — a replay is 401;
//   4. the tenant is the business this credential is bound to (BUREAU_OS_BUSINESS_ID).
//      The body never chooses a tenant: work of another business is not found.
//
// Not a browser session and not reachable with one: Marcel never logs in here
// for the OS to delegate work.

import { sql as dsql } from "drizzle-orm";
import { AGENT_HEADERS, verifySignature, WORK_CLIENT, workDoorSecret } from "@maxpromo/config/agent-contract";
import { getDb, isDbConfigured } from "@/lib/db";
import { workNonces } from "@/lib/db/schema";
import { osLinkedBusinessId } from "@/lib/os/client";

type Env = Record<string, string | undefined>;

export type DoorResult =
  | { ok: true; businessId: string; body: Record<string, unknown> }
  | { ok: false; status: 400 | 401 | 503; error: string };

export interface DoorDeps {
  env?: Env;
  /** Records a nonce; false when it was already recorded. Injected by the proof. */
  recordNonce?: (nonce: string) => Promise<boolean>;
  nowSeconds?: number;
}

async function recordNonceInDb(nonce: string): Promise<boolean> {
  const db = getDb();
  const fresh = await db.insert(workNonces).values({ nonce }).onConflictDoNothing().returning({ nonce: workNonces.nonce });
  // Housekeeping, cheap and bounded: nonces outside every possible window.
  if (Math.random() < 0.05) await db.delete(workNonces).where(dsql`${workNonces.receivedAt} < now() - interval '1 day'`);
  return fresh.length > 0;
}

export async function admitWorkRequest(p: {
  headers: { get(name: string): string | null };
  method: string;
  path: string;
  rawBody: string;
}, deps: DoorDeps = {}): Promise<DoorResult> {
  const env = deps.env ?? process.env;
  if (p.headers.get(AGENT_HEADERS.client) !== WORK_CLIENT) return { ok: false, status: 400, error: "unknown_client" };
  const secret = workDoorSecret(env);
  if (!secret) return { ok: false, status: 503, error: "work_door_not_configured" };
  // One credential per direction: the Bureau's credential into the OS must never also open this door.
  if (env.OS_BUREAU_AGENT_SECRET && env.OS_BUREAU_AGENT_SECRET === secret) {
    console.error("[work-door] refused: the work secret equals the OS agent secret");
    return { ok: false, status: 503, error: "work_door_not_configured" };
  }
  const verdict = verifySignature({ secret, headers: p.headers, method: p.method, path: p.path, body: p.rawBody, nowSeconds: deps.nowSeconds });
  if (!verdict.ok) {
    // One answer for every signature failure; which check failed is for the operator.
    console.warn("[work-door] refused:", verdict.reason);
    return { ok: false, status: 401, error: "unauthorized" };
  }
  const businessId = osLinkedBusinessId();
  if (!businessId) return { ok: false, status: 503, error: "tenant_not_configured" };
  if (!deps.recordNonce && !isDbConfigured()) return { ok: false, status: 503, error: "database_not_configured" };
  if (!(await (deps.recordNonce ?? recordNonceInDb)(verdict.nonce))) {
    console.warn("[work-door] refused: replayed nonce");
    return { ok: false, status: 401, error: "unauthorized" };
  }
  try {
    const parsed: unknown = p.rawBody ? JSON.parse(p.rawBody) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    return { ok: true, businessId, body: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, status: 400, error: "invalid_json" };
  }
}
