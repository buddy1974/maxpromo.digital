import { apiOk } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { getGovernance } from "@/lib/db/queries/governance";

// Read-only assessment data. No real tool scanning.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;
  // Auth-5: scope to session businessId — no global demo lookup.
  return apiOk(await getGovernance(auth.businessId));
}
