-- Auth-1A: add auth columns to app_users
-- DO NOT APPLY if already applied — check column existence first
-- Part of the Auth-1 implementation chain (Auth-0 baseline → this migration → Auth-1B NextAuth install)

ALTER TABLE "app_users" ADD COLUMN "password_hash" text;
--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "last_login_at" timestamp with time zone;
