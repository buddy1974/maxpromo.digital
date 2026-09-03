import { apiOk } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { MOCK_CLIENT_IMPLEMENTATIONS } from "@/lib/mock/client-implementation";

// Auth-3: authenticated session required. argon2 import chain requires nodejs.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TODO(sprint-4): real client install records (org-scoped).
export async function GET() {
  // Auth-3: require authenticated session before returning client implementation data.
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;

  return apiOk(MOCK_CLIENT_IMPLEMENTATIONS);
}
