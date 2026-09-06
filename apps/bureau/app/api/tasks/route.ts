import { apiOk } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { MOCK_TASKS } from "@/lib/mock/tasks";

// Auth-3: authenticated session required. argon2 import chain requires nodejs.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TODO(sprint-3): org-scoped DB read. POST guarded + Zod-validated when wired.
export async function GET() {
  // Auth-3: require authenticated session before returning tasks.
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;

  return apiOk(MOCK_TASKS);
}
