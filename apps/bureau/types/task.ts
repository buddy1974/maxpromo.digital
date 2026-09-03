export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO date string, optional. */
  dueDate?: string;
  assignee?: string;
  projectId?: string;
  /** Whether the task originated from a human or an agent proposal. */
  source: "manual" | "agent";
  isOverdue?: boolean;
}
