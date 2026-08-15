-- Ảnh minh hoạ quà trong shop. NULL = chưa có ảnh → client vẽ ô màu theo id (như cũ).
ALTER TABLE "shop_deals" ADD COLUMN IF NOT EXISTS "image_url" text;
