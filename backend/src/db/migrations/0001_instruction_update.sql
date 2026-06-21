ALTER TYPE "public"."ledger_source" ADD VALUE IF NOT EXISTS 'REWARD';--> statement-breakpoint
CREATE TYPE "public"."point_event_target" AS ENUM('GOLD', 'DIAMOND', 'GREEN', 'ALL');--> statement-breakpoint
CREATE TYPE "public"."leaderboard_type" AS ENUM('TOP_VOTER', 'TOP_EARNER');--> statement-breakpoint
CREATE TYPE "public"."leaderboard_period" AS ENUM('DAY', 'WEEK', 'MONTH');--> statement-breakpoint
CREATE TYPE "public"."reward_status" AS ENUM('PENDING', 'APPROVED', 'SENT');--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "referee_gold_earned" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "reward_config" jsonb;--> statement-breakpoint
ALTER TABLE "idols" ADD COLUMN IF NOT EXISTS "bio" text;--> statement-breakpoint
ALTER TABLE "iap_packages" ADD COLUMN IF NOT EXISTS "bonus_diamond" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "point_events" ADD COLUMN IF NOT EXISTS "target_currency" "point_event_target" DEFAULT 'ALL' NOT NULL;--> statement-breakpoint
ALTER TABLE "point_events" ADD COLUMN IF NOT EXISTS "applies_to_sources" text[];--> statement-breakpoint
ALTER TABLE "point_events" ADD COLUMN IF NOT EXISTS "banner_text" text;--> statement-breakpoint
ALTER TABLE "point_events" ADD COLUMN IF NOT EXISTS "banner_image" text;--> statement-breakpoint
DROP TABLE IF EXISTS "donation_receipts" CASCADE;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donation_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL REFERENCES "campaigns"("id"),
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"gold_voted" bigint NOT NULL,
	"donated_vnd" bigint NOT NULL,
	"donation_ratio_bps" integer NOT NULL,
	"receipt_no" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "donation_receipts_campaign_user_uq" ON "donation_receipts" ("campaign_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "donation_receipts_no_uq" ON "donation_receipts" ("receipt_no");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leaderboard_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"board_type" "leaderboard_type" NOT NULL,
	"period" "leaderboard_period" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"rank" integer NOT NULL,
	"score" bigint NOT NULL,
	"reward_status" "reward_status" DEFAULT 'PENDING' NOT NULL,
	"reward_config" jsonb,
	"granted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "leaderboard_snapshots_uq" ON "leaderboard_snapshots" ("board_type","period","period_start","rank");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"event_name" text NOT NULL,
	"props" jsonb,
	"platform" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_name_idx" ON "analytics_events" ("event_name","created_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_metrics" (
	"metric_date" date PRIMARY KEY NOT NULL,
	"dau" integer DEFAULT 0 NOT NULL,
	"wau" integer DEFAULT 0 NOT NULL,
	"mau" integer DEFAULT 0 NOT NULL,
	"new_users" integer DEFAULT 0 NOT NULL,
	"revenue_vnd" bigint DEFAULT 0 NOT NULL,
	"ad_revenue_gold" bigint DEFAULT 0 NOT NULL,
	"topup_diamond" bigint DEFAULT 0 NOT NULL,
	"gold_issued" bigint DEFAULT 0 NOT NULL,
	"gold_spent" bigint DEFAULT 0 NOT NULL,
	"gold_liability" bigint DEFAULT 0 NOT NULL,
	"green_earned" bigint DEFAULT 0 NOT NULL,
	"green_spent" bigint DEFAULT 0 NOT NULL,
	"green_expired" bigint DEFAULT 0 NOT NULL,
	"total_votes" bigint DEFAULT 0 NOT NULL,
	"vote_green" bigint DEFAULT 0 NOT NULL,
	"vote_gold" bigint DEFAULT 0 NOT NULL,
	"event_bonus_cost" bigint DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_metrics" (
	"user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"first_seen" timestamp with time zone,
	"last_seen" timestamp with time zone,
	"lifetime_gold_earned" bigint DEFAULT 0 NOT NULL,
	"lifetime_spend_vnd" bigint DEFAULT 0 NOT NULL,
	"total_topup_vnd" bigint DEFAULT 0 NOT NULL,
	"total_votes" bigint DEFAULT 0 NOT NULL,
	"is_paying" boolean DEFAULT false NOT NULL,
	"ltv_vnd" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cohort_retention" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"cohort_date" date NOT NULL,
	"day_offset" integer NOT NULL,
	"retained_users" integer DEFAULT 0 NOT NULL,
	"cohort_size" integer DEFAULT 0 NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cohort_retention_uq" ON "cohort_retention" ("cohort_date","day_offset");
