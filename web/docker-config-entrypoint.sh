#!/bin/sh
# Sinh /config.js từ env API_BASE_URL lúc container khởi động (nginx chạy /docker-entrypoint.d/*.sh).
# API_BASE_URL rỗng → app dùng '/api/v1' (proxy qua nginx tới BACKEND_ORIGIN).
# API_BASE_URL đặt giá trị → browser gọi backend trực tiếp (cần backend bật CORS) — dùng khi web & backend ở 2 nơi.
set -e
cat > /usr/share/nginx/html/config.js <<EOF
window.__FDV_CONFIG__ = { apiBaseUrl: "${API_BASE_URL}" };
EOF
echo "[fdv] config.js → apiBaseUrl=\"${API_BASE_URL}\""
