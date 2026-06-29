#!/bin/sh
# Sinh /config.js từ env lúc container khởi động (nginx chạy /docker-entrypoint.d/*.sh).
# API_BASE_URL rỗng → app dùng '/api/v1' (proxy qua nginx tới BACKEND_ORIGIN).
# API_BASE_URL đặt giá trị → browser gọi backend trực tiếp (cần backend bật CORS) — dùng khi web & backend ở 2 nơi.
# GOOGLE_CLIENT_ID rỗng → ẩn nút "Đăng nhập Google". Đặt = OAuth client ID (cùng giá trị backend) để bật.
set -e
cat > /usr/share/nginx/html/config.js <<EOF
window.__FDV_CONFIG__ = { apiBaseUrl: "${API_BASE_URL}", googleClientId: "${GOOGLE_CLIENT_ID}" };
EOF
echo "[fdv] config.js → apiBaseUrl=\"${API_BASE_URL}\" googleClientId=\"${GOOGLE_CLIENT_ID}\""
