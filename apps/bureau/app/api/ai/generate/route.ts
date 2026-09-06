import { apiOk, apiError } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { hasAIConfig } from "@/config/env";
import { aiGenerateSchema } from "@/lib/validation/ai";
import { generate } from "@/lib/ai/provider";
import { checkRateLimit, AI_GENERATE_LIMIT } from "@/lib/security/rate-limit";

// SAFETY: generates a DRAFT only. No DB write, no outbound message, no execution,
// no external integration beyond the AI API call itself.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Auth-3: gate the cost surface — no anonymous generation.
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;

  // Auth-4: rate-limit by userId. 10 req / 60s per authenticated user.
  // WHY user-keyed (not IP): authenticated requests have a stable identity.
  const rl = await checkRateLimit(`ai:${auth.user.id}`, AI_GENERATE_LIMIT);
  if (!rl.ok) return apiError("rate_limited", 429);

  // Key is checked HERE (not at app boot) — dashboard builds without it.
  if (!hasAIConfig()) {
    return apiError("ai_not_configured", 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("invalid_json", 400);
  }

  const parsed = aiGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalid_request", 422, parsed.error.flatten().fieldErrors);
  }

  const result = await generate(parsed.data);
  if (!result.ok) {
    // Map provider errors to a safe status.
    const status = result.error === "ai_not_configured" ? 503 : 502;
    return apiError(result.error, status);
  }
  return apiOk(result.data);
}
