import { apiOk } from "@/lib/api/response";
import { requireApiBusinessId } from "@/lib/auth/api-guard";
import {
  OPERATING_STAGES,
  SAFE_ACTION_LIFECYCLE,
  AGENT_RECOMMENDATIONS,
} from "@/lib/core/operating-model";
import { AGENT_HIERARCHY } from "@/lib/core/agent-hierarchy";
import { MOCK_MANUAL_DELIVERY_NOTES } from "@/lib/mock/operating-model";

// Auth-3: authenticated session required. argon2 import chain requires nodejs.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The backbone, as data. Static/config — protected by auth from Auth-3.
export async function GET() {
  // Auth-3: require authenticated session before returning operating model config.
  const auth = await requireApiBusinessId();
  if (!auth.ok) return auth.response;

  return apiOk({
    stages: OPERATING_STAGES,
    lifecycle: SAFE_ACTION_LIFECYCLE,
    recommendations: AGENT_RECOMMENDATIONS,
    hierarchy: AGENT_HIERARCHY,
    manualDeliveryNotes: MOCK_MANUAL_DELIVERY_NOTES,
  });
}
