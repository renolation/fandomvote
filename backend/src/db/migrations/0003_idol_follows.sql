CREATE TABLE IF NOT EXISTS "idol_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"idol_id" uuid NOT NULL REFERENCES "idols"("id"),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idol_follows_user_idol_uq" UNIQUE("user_id","idol_id")
);
