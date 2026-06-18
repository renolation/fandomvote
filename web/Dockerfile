# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_BASE_URL mặc định '/api/v1' (proxy qua nginx). Override khi cần gọi backend tuyệt đối.
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# ---- runtime stage (nginx static + proxy /api) ----
FROM nginx:1.27-alpine AS runtime
# nginx image tự envsubst /etc/nginx/templates/*.template → /etc/nginx/conf.d/ lúc khởi động.
# Chỉ thay biến môi trường đã định nghĩa (BACKEND_ORIGIN); biến nginx ($host…) giữ nguyên.
# BACKEND_ORIGIN: đích proxy /api của nginx (chế độ cùng origin).
# API_BASE_URL: URL backend cho BROWSER gọi trực tiếp (chế độ 2 nơi khác nhau; cần CORS). Rỗng = dùng proxy.
ENV BACKEND_ORIGIN=http://backend:3000
ENV API_BASE_URL=
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-config-entrypoint.sh /docker-entrypoint.d/30-fdv-config.sh
RUN chmod +x /docker-entrypoint.d/30-fdv-config.sh
EXPOSE 80
