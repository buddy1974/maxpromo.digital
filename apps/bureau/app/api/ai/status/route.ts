import { apiOk } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { getAIConfig } from "@/config/env";

// Read-only AI readiness. Never returns the API key.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Auth-3: require authenticated session before returning AI config status.
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;

  const { provider, model, configured } = getAIConfig();
  return apiOk({ provider, model, configured });
}
