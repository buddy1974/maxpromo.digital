export type MemoryEntryType =
  | "contact"
  | "company"
  | "project"
  | "decision"
  | "note"
  | "conversation";

export interface MemoryEntry {
  id: string;
  type: MemoryEntryType;
  title: string;
  summary: string;
  /** Related entity reference, optional (e.g. contactId/projectId). */
  relatedTo?: string;
  /** ISO timestamp. */
  createdAt: string;
  source: "manual" | "agent";
}
