// Giờ server UTC+7 (Asia/Ho_Chi_Minh) khóa cứng — §0.4. VN không có DST nên offset cố định.
const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;

export function now(): Date {
  return new Date();
}

// Cuối ngày UTC+7 (23:59:59.999) của `base`, trả về instant UTC — dùng cho hạn Green daily.
export function vnEndOfDay(base: Date = new Date()): Date {
  const vn = new Date(base.getTime() + TZ_OFFSET_MS);
  const endVnMs = Date.UTC(
    vn.getUTCFullYear(),
    vn.getUTCMonth(),
    vn.getUTCDate(),
    23,
    59,
    59,
    999,
  );
  return new Date(endVnMs - TZ_OFFSET_MS);
}

// Chuỗi ngày UTC+7 dạng YYYY-MM-DD — key cho green_daily_counter.
export function vnDateString(base: Date = new Date()): string {
  return new Date(base.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

// now + n ngày (chính xác theo giờ, không end-of-day) — referral Green hạn 7 ngày (§9).
export function addDays(days: number, base: Date = new Date()): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addSeconds(seconds: number, base: Date = new Date()): Date {
  return new Date(base.getTime() + seconds * 1000);
}

export type LeaderboardPeriod = 'DAY' | 'WEEK' | 'MONTH';

// Khoảng [start, end) UTC theo lịch UTC+7 cho leaderboard — §17. WEEK bắt đầu Thứ 2.
export function periodRange(
  period: LeaderboardPeriod,
  base: Date = new Date(),
): { start: Date; end: Date } {
  const vn = new Date(base.getTime() + TZ_OFFSET_MS);
  const y = vn.getUTCFullYear();
  const m = vn.getUTCMonth();
  const d = vn.getUTCDate();
  let startVn: number;
  let endVn: number;
  if (period === 'DAY') {
    startVn = Date.UTC(y, m, d);
    endVn = Date.UTC(y, m, d + 1);
  } else if (period === 'WEEK') {
    const dow = (new Date(Date.UTC(y, m, d)).getUTCDay() + 6) % 7; // Mon=0
    startVn = Date.UTC(y, m, d - dow);
    endVn = startVn + 7 * 86400000;
  } else {
    startVn = Date.UTC(y, m, 1);
    endVn = Date.UTC(y, m + 1, 1);
  }
  return { start: new Date(startVn - TZ_OFFSET_MS), end: new Date(endVn - TZ_OFFSET_MS) };
}

// Kỳ liền trước (để snapshot lúc kết kỳ).
export function previousPeriodRange(
  period: LeaderboardPeriod,
  base: Date = new Date(),
): { start: Date; end: Date } {
  const cur = periodRange(period, base);
  return periodRange(period, new Date(cur.start.getTime() - 1000));
}
