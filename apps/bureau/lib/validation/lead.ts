import { z } from "zod";

// Shared client + server validation. The form and the API use the SAME schema,
// so what the UI accepts and what the DB stores can never drift apart.
export const ctaTypeSchema = z.enum(["audit", "call", "contact"]);

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Bitte Namen angeben.").max(120),
  email: z.string().trim().email("Bitte gültige E-Mail angeben.").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  ctaType: ctaTypeSchema.default("audit"),
  // Honeypot: bots fill hidden fields. Must be empty.
  website: z.string().max(0).optional().or(z.literal("")),
  // Attribution (best-effort, never required, never trusted for logic).
  attribution: z
    .object({
      utmSource: z.string().max(200).optional(),
      utmMedium: z.string().max(200).optional(),
      utmCampaign: z.string().max(200).optional(),
      utmContent: z.string().max(200).optional(),
      utmTerm: z.string().max(200).optional(),
      refCode: z.string().max(120).optional(),
      landingPath: z.string().max(500).optional(),
      referrer: z.string().max(500).optional(),
    })
    .partial()
    .optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
