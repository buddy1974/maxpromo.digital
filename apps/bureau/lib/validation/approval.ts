import { z } from "zod";

// Shared validation for the approval PATCH endpoint.
export const approvalActionSchema = z.object({
  action: z.enum(["approve", "reject", "mark_reviewed"]),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
