-- Delegated agent work (ADR-0030). Additive and replay-safe.
CREATE TABLE IF NOT EXISTS "agent_work" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"agent_key" text NOT NULL,
	"capability" text NOT NULL,
	"requested_by" text NOT NULL,
	"source" text NOT NULL,
	"subject_kind" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"subject_label" text NOT NULL,
	"input" jsonb NOT NULL,
	"objective" text NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"result" jsonb,
	"failure" jsonb,
	"model" text,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"delivery_error" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_nonces" (
	"nonce" text PRIMARY KEY NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "agent_work" ADD CONSTRAINT "agent_work_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_work_biz_idx" ON "agent_work" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_work_state_idx" ON "agent_work" USING btree ("state");--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "agent_work" ADD CONSTRAINT "agent_work_state_ck" CHECK ("state" IN ('queued','running','completed','failed','cancelled')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
