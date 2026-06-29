// Runtime config. Dev: rỗng → app dùng VITE_* / '/api/v1' (proxy Vite).
// Prod (container): file này bị container ghi đè từ env API_BASE_URL + GOOGLE_CLIENT_ID.
window.__FDV_CONFIG__ = { apiBaseUrl: '', googleClientId: '' };
