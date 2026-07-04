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

// Chỉ ngày (dd/mm/yyyy) — dùng cho khoảng thời gian sự kiện/campaign.
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN');
}

// Thời gian tương đối (Vừa xong / N phút trước / Hôm qua…) — chỉ hiển thị.
export function relativeTime(iso: string | null, nowMs: number): string {
  if (!iso) return '';
  const diff = nowMs - new Date(iso).getTime();
  if (diff < 60_000) return 'Vừa xong';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Hôm qua';
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

// Đếm ngược dựa mốc SERVER (iso) — chỉ hiển thị, không quyết định nghiệp vụ (§0.3).
// Đơn vị nhỏ nhất = PHÚT (không hiện giây).
export function countdownLabel(targetIso: string | null, nowMs: number): string {
  if (!targetIso) return '';
  const diff = new Date(targetIso).getTime() - nowMs;
  if (diff <= 0) return 'Đã hết hạn';
  const totalMin = Math.floor(diff / 60_000);
  if (totalMin < 1) return 'Dưới 1 phút';
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}n ${h}g ${m}p`;
  if (h > 0) return `${h}g ${m}p`;
  return `${m}p`;
}
