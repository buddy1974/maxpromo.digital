import type { DashboardSummary, DailyBriefing, DashboardMetric } from "@/types/dashboard";
import { AGENTS } from "@/lib/registry/agents";
import { MOCK_APPROVALS } from "./approvals";
import { MOCK_OVERDUE_TASKS } from "./tasks";
import { MOCK_URGENT_FOLLOWUPS } from "./contacts";
import { MOCK_ACTIVITY } from "./activity";

const BRIEFING: DailyBriefing = {
  date: "2026-05-29",
  greeting: "Guten Morgen, Marcel.",
  headline: "3 Freigaben offen, 2 überfällige Aufgaben, 1 Projekt blockiert.",
  items: [
    { id: "b-1", label: "Zuerst", detail: "Audit-Anfrage aus Essen beantworten (heute fällig)." },
    { id: "b-2", label: "Freigaben", detail: "3 Agenten-Vorschläge warten auf Ihre Prüfung." },
    { id: "b-3", label: "Risiko", detail: "Projekt 'Website-Migration' ist blockiert (Staging)." },
    { id: "b-4", label: "Follow-up", detail: "Druckerei hat seit dem Erstgespräch nicht geantwortet." },
  ],
};

const METRICS: DashboardMetric[] = [
  { id: "mt-1", label: "Offene Freigaben", value: "3", trend: "up", delta: "+1", hint: "Warten auf Prüfung" },
  { id: "mt-2", label: "Aktive Agenten", value: "3", trend: "flat", hint: "von 9 im Bureau" },
  { id: "mt-3", label: "Überfällige Aufgaben", value: "2", trend: "down", delta: "-1" },
  { id: "mt-4", label: "Fällige Follow-ups", value: "3", trend: "up", delta: "+2" },
];

// Single assembled summary used by the dashboard overview and its API route.
export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  briefing: BRIEFING,
  metrics: METRICS,
  pendingApprovals: MOCK_APPROVALS.filter((p) => p.status === "pending"),
  activeAgents: AGENTS.filter((a) => a.status === "active" || a.status === "proposing"),
  urgentFollowUps: MOCK_URGENT_FOLLOWUPS,
  overdueTasks: MOCK_OVERDUE_TASKS,
  recentActivity: MOCK_ACTIVITY,
};
