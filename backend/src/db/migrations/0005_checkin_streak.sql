ALTER TABLE "green_daily_counter" ADD COLUMN IF NOT EXISTS "checkin_day_index" integer;--> statement-breakpoint
-- Backfill: ngày đã điểm danh trước đây coi như ngày 1 của chuỗi (không truy hồi được lịch sử).
UPDATE "green_daily_counter" SET "checkin_day_index" = 1 WHERE "checkin_claimed_at" IS NOT NULL AND "checkin_day_index" IS NULL;
