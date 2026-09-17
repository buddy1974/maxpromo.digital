/**
 * Demo activity. The feed is the system narrating what it did, so the action
 * and the detail are in demo.activity and follow the reader. The target is a
 * record — a customer, a project — and is printed as it stands, the same way
 * real data would be.
 */
export interface ActivityRecord {
  id: string;
  timestamp: string;
  actor: "user" | "agent" | "system";
  actorName: string;
  target?: string;
  hasDetail: boolean;
}

export const MOCK_ACTIVITY: ActivityRecord[] = [
  { id: "a-5001", timestamp: "2026-05-29T07:55:00Z", actor: "agent",  actorName: "Chief of Staff",  hasDetail: true },
  { id: "a-5002", timestamp: "2026-05-29T07:40:00Z", actor: "agent",  actorName: "Lead Agent",      target: "Trattoria Bella Essen", hasDetail: true },
  { id: "a-5003", timestamp: "2026-05-29T06:50:00Z", actor: "agent",  actorName: "Follow-Up Agent", hasDetail: true },
  { id: "a-5004", timestamp: "2026-05-29T06:30:00Z", actor: "agent",  actorName: "CRM Agent",       hasDetail: true },
  { id: "a-5005", timestamp: "2026-05-28T17:10:00Z", actor: "user",   actorName: "Marcel",          target: "RestaurantOS — Einführung", hasDetail: true },
  { id: "a-5006", timestamp: "2026-05-28T16:20:00Z", actor: "agent",  actorName: "Research Agent",  hasDetail: true },
  { id: "a-5007", timestamp: "2026-05-28T09:05:00Z", actor: "system", actorName: "System",          hasDetail: true },
];
