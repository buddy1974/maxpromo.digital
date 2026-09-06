import { apiOk } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { getProposals } from "@/lib/db/queries/approvals";

// Read-only. POST approve/reject is intentionally NOT implemented — no execution
// path until auth + audit + ownership land (Sprint 5).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;
  // Auth-5: scope to session businessId — no global demo lookup.
  return apiOk(await getProposals(auth.businessId));
}
