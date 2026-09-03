import type { Agent, AgentProposal } from "./agent";
import type { Task } from "./task";
import type { ActivityLog } from "./activity";
import type { Contact } from "./contact";

export type MetricTrend = "up" | "down" | "flat";

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  trend?: MetricTrend;
  /** e.g. "+2" or "-1" — short delta annotation. */
  delta?: string;
  hint?: string;
}

export interface BriefingItem {
  id: string;
  label: string;
  detail: string;
}

export interface DailyBriefing {
  /** ISO date string for the briefing day. */
  date: string;
  greeting: string;
  headline: string;
  items: BriefingItem[];
}

/** Aggregate shape returned by /api/dashboard/summary. */
export interface DashboardSummary {
  briefing: DailyBriefing;
  metrics: DashboardMetric[];
  pendingApprovals: AgentProposal[];
  activeAgents: Agent[];
  urgentFollowUps: Contact[];
  overdueTasks: Task[];
  recentActivity: ActivityLog[];
}
