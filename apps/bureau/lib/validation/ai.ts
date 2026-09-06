import { z } from "zod";
import { MAX_INPUT_CHARS } from "@/lib/ai/safety";

// Validation for POST /api/ai/generate.
export const aiGenerateSchema = z.object({
  task: z.enum([
    "follow_up_draft",
    "audit_summary",
    "document_summary",
    "waiting_room_response",
    "governance_recommendation",
    "proposal_draft",
  ]),
  context: z.object({
    businessName: z.string().max(200).optional(),
    source: z.string().max(200).optional(),
    input: z.string().trim().min(1, "empty_input").max(MAX_INPUT_CHARS, "input_too_large"),
    riskContext: z.string().max(500).optional(),
    relatedEntityId: z.string().max(120).optional(),
  }),
});

export type AIGenerateInput = z.infer<typeof aiGenerateSchema>;
