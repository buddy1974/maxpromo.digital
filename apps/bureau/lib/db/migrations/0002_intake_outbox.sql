-- Intake outbox (ADR-0021). Additive and replay-safe.
ALTER TABLE "lead_submissions" ADD COLUMN IF NOT EXISTS "forward_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_submissions" ADD COLUMN IF NOT EXISTS "last_forward_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_submissions" ADD COLUMN IF NOT EXISTS "last_forward_error" text;