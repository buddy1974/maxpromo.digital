import type { ApprovalStatus } from "./agent";

export type WaitingChannel =
  | "whatsapp"
  | "email"
  | "phone"
  | "website_form"
  | "social";

export type WaitingUrgency = "low" | "medium" | "high" | "urgent";
export type WaitingStatus = "waiting" | "draft_ready" | "responded" | "lost";

export interface WaitingRoomItem {
  id: string;
  customerName: string;
  company?: string;
  channel: WaitingChannel;
  /** Why they are waiting. */
  reason: string;
  /** Human-readable waiting duration, e.g. "2 Tage". */
  waitingFor: string;
  urgency: WaitingUrgency;
  status: WaitingStatus;
  /** Prepared (NOT sent) next action / reply suggestion. */
  suggestedAction: string;
  assignedAgent: string;
  /** Approval state of the prepared response. */
  approvalStatus: ApprovalStatus;
  businessImpact: string;
}
