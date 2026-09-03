import { apiOk } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { MOCK_MEMORY } from "@/lib/mock/memory";

// Auth-3: authenticated session required. argon2 import chain requires nodejs.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TODO(sprint-3): org-scoped DB read + pgvector semantic search.
export async function GET() {
  // Auth-3: require authenticated session before returning memory store.
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;

  return apiOk(MOCK_MEMORY);
}
