CREATE TABLE IF NOT EXISTS "offer_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text,
	"icon_bg" text,
	"reward_gold" bigint NOT NULL,
	"provider" text DEFAULT 'INTERNAL' NOT NULL,
	"action_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
