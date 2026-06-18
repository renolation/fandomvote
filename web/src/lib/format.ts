import type { Currency } from '@/types/api';

// Chỉ FORMAT để hiển thị — KHÔNG tính toán nghiệp vụ (§0).
const nf = new Intl.NumberFormat('vi-VN');

export function formatNumber(n: number): string {
  return nf.format(n);
}

export function formatVnd(n: number): string {
  return `${nf.format(n)}đ`;
}

export const CURRENCY_LABEL: Record<Currency, string> = {
  GREEN: 'Green',
  GOLD: 'Gold',
  DIAMOND: 'Diamond',
};

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', { hour12: false });
}

// Đếm ngược dựa mốc SERVER (iso) — chỉ hiển thị, không quyết định nghiệp vụ (§0.3).
export function countdownLabel(targetIso: string | null, nowMs: number): string {
  if (!targetIso) return '';
  const diff = new Date(targetIso).getTime() - nowMs;
  if (diff <= 0) return 'Đã hết hạn';
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}n ${h}g`;
  if (h > 0) return `${h}g ${m}p`;
  if (m > 0) return `${m}p ${sec}s`;
  return `${sec}s`;
}
