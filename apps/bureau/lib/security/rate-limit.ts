/**
 * lib/security/rate-limit.ts — Auth-4
 *
 * Fixed-window rate limiter with two modes:
 *
 *   PRODUCTION  — Upstash Redis REST API (no SDK — plain fetch).
 *                 Activated when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *                 are present in env. Durable across serverless cold-starts.
 *
 *   LOCAL DEV   — In-memory Map. Resets on server restart / deploy.
 *                 Used automatically when Upstash env vars are absent.
 *
 * WHY fixed window (not sliding): simpler, no Lua scripts, no additional RTTs.
 * Burst at window boundary is acceptable at current traffic scale.
 *
 * WHY fail-open on Upstash errors: a Redis hiccup must not take down lead
 * capture or the approval workflow. Fail-open is safer for availability.
 *
 * Server-only. Do not import in client components.
 */

export interface RateLimitConfig {
  /** Maximum requests allowed within the window. */
  limit: number;
  /** Window size in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets. Only set when ok: false. */
  retryAfter?: number;
}

// ── In-memory store (local dev / fallback) ────────────────────────────────────

interface MemEntry {
  count: number;
  resetAt: number; // unix ms
}

// Module-scoped Map — persists for the lifetime of the Node.js process.
// Not suitable for production (multi-instance / serverless), but safe for local dev.
const _memStore = new Map<string, MemEntry>();

function checkMemory(key: string, { limit, windowSeconds }: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = _memStore.get(key);

  if (!entry || now >= entry.resetAt) {
    // New window — reset counter
    _memStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, retryAfter };
  }

  entry.count += 1;
  return { ok: true };
}

// ── Upstash REST (production) ─────────────────────────────────────────────────

async function checkUpstash(
  key: string,
  { limit, windowSeconds }: RateLimitConfig,
  url: string,
  token: string,
): Promise<RateLimitResult> {
  // Fixed-window key: one bucket per time slot. Expires automatically.
  const windowId = Math.floor(Date.now() / (windowSeconds * 1000));
  const redisKey = `rl:${key}:${windowId}`;

  try {
    // Pipeline: INCR then EXPIRE in one round-trip.
    // EXPIRE is idempotent — harmless if TTL is already set.
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSeconds],
      ]),
    });

    if (!res.ok) {
      // Upstash unavailable — fail open (do not block traffic on infra error)
      console.error("[rate-limit] Upstash error:", res.status);
      return { ok: true };
    }

    const data = (await res.json()) as [{ result: number }, unknown];
    const count = data[0]?.result ?? 0;

    if (count > limit) {
      // Approximate retryAfter: time remaining in the current window
      const windowEndMs = (windowId + 1) * windowSeconds * 1000;
      const retryAfter = Math.max(1, Math.ceil((windowEndMs - Date.now()) / 1000));
      return { ok: false, retryAfter };
    }
    return { ok: true };
  } catch {
    // Network error — fail open
    console.error("[rate-limit] Upstash fetch failed");
    return { ok: true };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * checkRateLimit — primary entry point.
 *
 * @param key     - Unique discriminator. Include a prefix + entity identifier.
 *                  Examples: "leads:1.2.3.4", "ai:user-uuid", "login:email@example.com"
 * @param config  - Limit + window settings.
 *
 * Returns { ok: true } to proceed, { ok: false, retryAfter } to reject.
 *
 * Call site pattern:
 *   const rl = await checkRateLimit(\`leads:\${ip}\`, LEADS_LIMIT);
 *   if (!rl.ok) return apiError("rate_limited", 429);
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url?.trim() && token?.trim()) {
    return checkUpstash(key, config, url.trim(), token.trim());
  }
  // Fallback: in-memory (local dev)
  return checkMemory(key, config);
}

/**
 * getClientIp — extracts the best-effort client IP from a Request.
 * On Vercel, x-forwarded-for is populated by the edge.
 * Falls back to "unknown" for local dev (in-memory rate-limiter handles this).
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ── Pre-configured limits (single source of truth) ───────────────────────────

/** POST /api/leads — public, IP-keyed */
export const LEADS_LIMIT: RateLimitConfig = { limit: 5, windowSeconds: 60 };

/** POST /api/ai/generate — authenticated, user-keyed */
export const AI_GENERATE_LIMIT: RateLimitConfig = { limit: 10, windowSeconds: 60 };

/** PATCH /api/approvals/[id] — authenticated, user-keyed */
export const APPROVALS_LIMIT: RateLimitConfig = { limit: 20, windowSeconds: 60 };

/** Login attempts — email-keyed */
export const LOGIN_LIMIT: RateLimitConfig = { limit: 10, windowSeconds: 900 };
