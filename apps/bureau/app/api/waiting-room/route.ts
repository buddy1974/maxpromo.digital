import { apiOk } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import { getWaitingRoom } from "@/lib/db/queries/waiting-room";

// Read-only. No outbound send from here.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;
  // Auth-5: scope to session businessId — no global demo lookup.
  return apiOk(await getWaitingRoom(auth.businessId));
}
