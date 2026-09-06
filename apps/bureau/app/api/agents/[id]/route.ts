import { apiOk, apiError } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { getAgentById } from "@/lib/registry/agents";

// Auth-3: authenticated session required. argon2 import chain requires nodejs.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Auth-3: require authenticated session before returning agent detail.
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const agent = getAgentById(id);
  if (!agent) return apiError("not_found", 404);
  return apiOk(agent);
}
