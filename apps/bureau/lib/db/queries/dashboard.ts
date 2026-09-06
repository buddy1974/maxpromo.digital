import { getAgents } from "./agents";
import { getProposals } from "./approvals";
import { getActivity } from "./activity";
import { getWaitingRoom } from "./waiting-room";
import { getAuditOverview } from "./audit";

export interface DashboardData {
  agents: Awaited<ReturnType<typeof getAgents>>;
  proposals: Awaited<ReturnType<typeof getProposals>>;
  activity: Awaited<ReturnType<typeof getActivity>>;
  waiting: Awaited<ReturnType<typeof getWaitingRoom>>;
  audit: Awaited<ReturnType<typeof getAuditOverview>>;
  /** True when the business has no data yet (prompt to run the seed). */
  empty: boolean;
}

// Read-only composite for the overview page. Each underlying query is already
// resilient (returns empty on no-DB / no-seed), so this never throws.
// Auth-5: businessId sourced from caller's session — not a global demo lookup.
export async function getDashboardData(businessId: string): Promise<DashboardData> {
  const [agents, proposals, activity, waiting, audit] = await Promise.all([
    getAgents(businessId),
    getProposals(businessId),
    getActivity(businessId, 8),
    getWaitingRoom(businessId),
    getAuditOverview(businessId),
  ]);
  const empty =
    agents.length === 0 &&
    proposals.length === 0 &&
    activity.length === 0 &&
    waiting.length === 0 &&
    !audit.session;
  return { agents, proposals, activity, waiting, audit, empty };
}
