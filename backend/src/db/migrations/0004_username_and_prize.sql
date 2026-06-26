ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_uq" ON "users" ("username");--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "prize" text;
