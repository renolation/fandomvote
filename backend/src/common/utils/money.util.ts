// Tiền = số nguyên. Ratio/multiplier lưu basis points (10000 = 1.0). Làm tròn FLOOR — §0.7/§6.

// 1 Diamond = 1.000 Gold — §4.
export const DIAMOND_TO_GOLD = 1000;

// total sau khi nhân multiplier (vd bps=20000 → x2).
export function applyMultiplierBps(base: number, bps: number): number {
  return Math.floor((base * bps) / 10000);
}

// Phần bonus tách riêng = total - base (ledger ghi 2 dòng base + bonus) — §8.
export function bonusFromMultiplierBps(base: number, bps: number): number {
  return applyMultiplierBps(base, bps) - base;
}

// Quỹ campaign = floor(Σ Gold × ratio) — §6. Dust giữ platform.
export function fundFromGold(goldTotal: number, ratioBps: number): number {
  return Math.floor((goldTotal * ratioBps) / 10000);
}
