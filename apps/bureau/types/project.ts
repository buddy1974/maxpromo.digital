export type ProjectStatus =
  | "planning"
  | "active"
  | "blocked"
  | "on_hold"
  | "done";

export type ProjectHealth = "on_track" | "at_risk" | "off_track";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  health: ProjectHealth;
  owner: string;
  /** ISO date string, optional. */
  dueDate?: string;
  /** 0–100. */
  progress: number;
  openTasks: number;
}
