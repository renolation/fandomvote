// Runtime config. Dev: rỗng → app dùng VITE_API_BASE_URL / '/api/v1' (proxy Vite).
// Prod (container): file này bị container ghi đè từ env API_BASE_URL.
window.__FDV_CONFIG__ = { apiBaseUrl: '' };
