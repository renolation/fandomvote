CREATE TYPE "public"."auth_provider" AS ENUM('LOCAL', 'GOOGLE');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('DRAFT', 'OPEN', 'CLOSED', 'RESOLVING', 'RESOLVED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('GREEN', 'GOLD', 'DIAMOND');--> statement-breakpoint
CREATE TYPE "public"."gift_item_status" AS ENUM('ACTIVE', 'USED', 'EXPIRED', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED');--> statement-breakpoint
CREATE TYPE "public"."gift_item_type" AS ENUM('DIGITAL', 'PHYSICAL');--> statement-breakpoint
CREATE TYPE "public"."idempotency_status" AS ENUM('PENDING', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."idol_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."ledger_source" AS ENUM('CHECKIN', 'EVENT_BONUS', 'REFERRAL', 'VIDEO', 'TASK', 'OFFERWALL', 'IAP_DIAMOND', 'DIAMOND_TO_GOLD', 'VOTE', 'VOTE_REVERSAL', 'PURCHASE', 'OFFERWALL_CHARGEBACK', 'ADMIN_ADJUST');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('SYSTEM', 'VOTE', 'CAMPAIGN', 'REFERRAL', 'SHOP', 'RESOLUTION');--> statement-breakpoint
CREATE TYPE "public"."point_event_type" AS ENUM('EARN_MULTIPLIER', 'TOPUP_MULTIPLIER');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('PENDING', 'REWARDED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."verification_channel" AS ENUM('EMAIL', 'PHONE');--> statement-breakpoint
CREATE TYPE "public"."verification_purpose" AS ENUM('VERIFY_EMAIL', 'VERIFY_PHONE');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"phone" text,
	"password_hash" text,
	"auth_provider" "auth_provider" DEFAULT 'LOCAL' NOT NULL,
	"google_sub" text,
	"display_name" text NOT NULL,
	"fandom" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"phone_verified_at" timestamp with time zone,
	"signup_ip" text,
	"device_fingerprint" text,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"family_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallet_ledger" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" "currency" NOT NULL,
	"amount" bigint NOT NULL,
	"source" "ledger_source" NOT NULL,
	"expires_at" timestamp with time zone,
	"real_value_vnd" bigint DEFAULT 0 NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"consumes_ledger_id" bigint,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "green_daily_counter" (
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"green_earned_today" bigint DEFAULT 0 NOT NULL,
	"checkin_claimed_at" timestamp with time zone,
	CONSTRAINT "green_daily_counter_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"scope" text NOT NULL,
	"status" "idempotency_status" DEFAULT 'PENDING' NOT NULL,
	"response_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"aliases" text[],
	"avatar_url" text,
	"status" "idol_status" DEFAULT 'PENDING' NOT NULL,
	"nominated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"rules_content" text,
	"star_goal" bigint NOT NULL,
	"donation_ratio_bps" integer DEFAULT 5000 NOT NULL,
	"status" "campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"open_at" timestamp with time zone,
	"close_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"snapshotted_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaign_idols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"idol_id" uuid NOT NULL,
	"total_votes" bigint DEFAULT 0 NOT NULL,
	"reached_value_at" timestamp with time zone,
	"added_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vote_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"campaign_idol_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"currency" "currency" NOT NULL,
	"amount" bigint NOT NULL,
	"real_value_vnd" bigint DEFAULT 0 NOT NULL,
	"running_total" bigint NOT NULL,
	"is_reversal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaign_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"campaign_idol_id" uuid NOT NULL,
	"idol_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"total_votes" bigint NOT NULL,
	"reached_value_at" timestamp with time zone,
	"snapshotted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shop_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"partner_id" uuid,
	"cost" bigint NOT NULL,
	"currency" "currency" NOT NULL,
	"item_type" "gift_item_type" NOT NULL,
	"stock" integer NOT NULL,
	"stock_sold" integer DEFAULT 0 NOT NULL,
	"validity_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipping_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recipient" text NOT NULL,
	"phone" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"ward" text,
	"district" text,
	"province" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gift_wallet_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"item_type" "gift_item_type" NOT NULL,
	"status" "gift_item_status" NOT NULL,
	"code" text,
	"expires_at" timestamp with time zone,
	"shipping_address_id" uuid,
	"used_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "iap_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"title" text NOT NULL,
	"diamond_amount" bigint NOT NULL,
	"price_vnd" bigint NOT NULL,
	"platform" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_rewards_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_index" integer NOT NULL,
	"green_amount" bigint NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "point_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"type" "point_event_type" NOT NULL,
	"multiplier_bps" integer NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"max_bonus_per_user" bigint,
	"max_bonus_total" bigint,
	"bonus_total_used" bigint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referee_id" uuid NOT NULL,
	"status" "referral_status" DEFAULT 'PENDING' NOT NULL,
	"signup_ip" text,
	"device_fingerprint" text,
	"rewarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" DEFAULT 'SYSTEM' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donation_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"fund_vnd" bigint NOT NULL,
	"gold_total" bigint NOT NULL,
	"donation_ratio_bps" integer NOT NULL,
	"receipt_no" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" "verification_channel" NOT NULL,
	"purpose" "verification_purpose" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "green_daily_counter" ADD CONSTRAINT "green_daily_counter_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idols" ADD CONSTRAINT "idols_nominated_by_users_id_fk" FOREIGN KEY ("nominated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaign_idols" ADD CONSTRAINT "campaign_idols_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaign_idols" ADD CONSTRAINT "campaign_idols_idol_id_idols_id_fk" FOREIGN KEY ("idol_id") REFERENCES "public"."idols"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaign_idols" ADD CONSTRAINT "campaign_idols_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_logs" ADD CONSTRAINT "vote_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_logs" ADD CONSTRAINT "vote_logs_campaign_idol_id_campaign_idols_id_fk" FOREIGN KEY ("campaign_idol_id") REFERENCES "public"."campaign_idols"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_logs" ADD CONSTRAINT "vote_logs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaign_snapshots" ADD CONSTRAINT "campaign_snapshots_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaign_snapshots" ADD CONSTRAINT "campaign_snapshots_campaign_idol_id_campaign_idols_id_fk" FOREIGN KEY ("campaign_idol_id") REFERENCES "public"."campaign_idols"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaign_snapshots" ADD CONSTRAINT "campaign_snapshots_idol_id_idols_id_fk" FOREIGN KEY ("idol_id") REFERENCES "public"."idols"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shop_deals" ADD CONSTRAINT "shop_deals_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipping_addresses" ADD CONSTRAINT "shipping_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gift_wallet_items" ADD CONSTRAINT "gift_wallet_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gift_wallet_items" ADD CONSTRAINT "gift_wallet_items_deal_id_shop_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."shop_deals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gift_wallet_items" ADD CONSTRAINT "gift_wallet_items_shipping_address_id_shipping_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."shipping_addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_receipts" ADD CONSTRAINT "donation_receipts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_uq" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_sub_uq" ON "users" USING btree ("google_sub");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_family_idx" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_ledger_balance_idx" ON "wallet_ledger" USING btree ("user_id","currency","expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_ledger_consumes_idx" ON "wallet_ledger" USING btree ("consumes_ledger_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idols_name_normalized_uq" ON "idols" USING btree ("name_normalized");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_idols_campaign_idol_uq" ON "campaign_idols" USING btree ("campaign_id","idol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaign_idols_leaderboard_idx" ON "campaign_idols" USING btree ("campaign_id","total_votes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vote_logs_campaign_idol_idx" ON "vote_logs" USING btree ("campaign_idol_id","id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vote_logs_user_idx" ON "vote_logs" USING btree ("user_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_snapshots_campaign_idol_uq" ON "campaign_snapshots" USING btree ("campaign_id","campaign_idol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipping_addresses_user_idx" ON "shipping_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_wallet_items_user_idx" ON "gift_wallet_items" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "iap_packages_sku_uq" ON "iap_packages" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_rewards_config_day_uq" ON "daily_rewards_config" USING btree ("day_index");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referee_uq" ON "referrals" USING btree ("referee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referrals_referrer_idx" ON "referrals" USING btree ("referrer_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "donation_receipts_campaign_uq" ON "donation_receipts" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "donation_receipts_no_uq" ON "donation_receipts" USING btree ("receipt_no");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_tokens_user_idx" ON "verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_log_admin_idx" ON "admin_audit_log" USING btree ("admin_id","id");