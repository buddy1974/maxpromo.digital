import type { DashboardSummary, DailyBriefing, DashboardMetric } from "@/types/dashboard";
import { AGENTS } from "@/lib/registry/agents";
import { MOCK_APPROVALS } from "./approvals";
import { MOCK_OVERDUE_TASKS } from "./tasks";
import { MOCK_URGENT_FOLLOWUPS } from "./contacts";
import { MOCK_ACTIVITY } from "./activity";

/**
 * The demo briefing, as structure. Its words are in demo.briefing, and the
 * greeting is not here at all: it is computed per request from the reader's
 * language and the time of day in Essen (lib/i18n/format.ts), so a message
 * file never contains a person's name.
 */
export const BRIEFING_ITEM_IDS = ["b-1", "b-2", "b-3", "b-4"] as const;

/** Demo metrics, as structure. Labels and hints are in demo.metrics. */
export const METRIC_RECORDS = [
  { id: "mt-1", value: "3", trend: "up" as const, delta: "+1", hint: true },
  { id: "mt-2", value: "3", trend: "flat" as const, hint: true },
  { id: "mt-3", value: "2", trend: "down" as const, delta: "-1", hint: false },
  { id: "mt-4", value: "3", trend: "up" as const, delta: "+2", hint: false },
];

// Single assembled summary used by the dashboard overview and its API route.
export const MOCK_DASHBOARD_SUMMARY = {
  pendingApprovals: MOCK_APPROVALS.filter((p) => p.status === "pending"),
  activeAgents: AGENTS.filter((a) => a.status === "active" || a.status === "proposing"),
  urgentFollowUps: MOCK_URGENT_FOLLOWUPS,
  overdueTasks: MOCK_OVERDUE_TASKS,
  recentActivity: MOCK_ACTIVITY,
};
