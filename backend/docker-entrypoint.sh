#!/bin/sh
# Init khi container khởi động (kiểu open-source): tự dựng schema + seed data lần đầu.
set -e

# 1) Schema — idempotent: DB trống thì tạo đủ bảng; DB đã có thì chỉ áp migration mới.
echo "[entrypoint] Migrate: tạo/cập nhật bảng…"
node dist/db/migrate.js

# 2) Data — INIT-ONCE: seed tự kiểm tra 'DB đã khởi tạo chưa' (bảng platform_config).
#    Chưa → seed ESSENTIAL (admin + config + gói IAP); rồi → bỏ qua. KHÔNG seed data demo.
#    SEED_DEMO=true → thêm data mẫu. SEED_FORCE=true → chạy lại dù đã init.
#    Seed lỗi KHÔNG làm chết app (schema đã sẵn, backend vẫn chạy).
echo "[entrypoint] Init data: seed nếu DB chưa khởi tạo…"
node dist/db/seed/seed.js || echo "[entrypoint] ⚠ seed lỗi — bỏ qua, app vẫn chạy."

echo "[entrypoint] Start backend…"
exec node dist/main.js
