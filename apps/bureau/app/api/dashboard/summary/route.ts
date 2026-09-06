import { apiOk } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { getDashboardData } from "@/lib/db/queries/dashboard";

// Reads the session business workspace from Neon (resilient: empty data if unseeded).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;
  // Auth-5: scope to session businessId — no global demo lookup.
  return apiOk(await getDashboardData(auth.businessId));
}
