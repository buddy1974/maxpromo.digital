export type ActivityActor = "user" | "agent" | "system";

export interface ActivityLog {
  id: string;
  /** ISO timestamp. */
  timestamp: string;
  actor: ActivityActor;
  actorName: string;
  action: string;
  target?: string;
  /** Optional human-readable detail. */
  detail?: string;
}
