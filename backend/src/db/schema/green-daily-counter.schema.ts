import { bigint, date, integer, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// 1 row/(user,ngày UTC+7). Ngày mới = row mới → không cần reset. §17 hardening.
// green_earned_today: chỉ earn tính trần (không gồm referral/event/refund miễn trần) — §4.
export const greenDailyCounter = pgTable(
  'green_daily_counter',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(), // ngày UTC+7 dạng YYYY-MM-DD
    greenEarnedToday: bigint('green_earned_today', { mode: 'number' }).notNull().default(0),
    checkinClaimedAt: timestamp('checkin_claimed_at', { withTimezone: true }), // check-in 1 lần/ngày
    // Ngày thứ mấy trong chuỗi (1..N) đã nhận hôm đó. Streak = đọc row hôm qua +1, ngắt ngày → về 1.
    checkinDayIndex: integer('checkin_day_index'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.date] }),
  }),
);

export type GreenDailyCounter = typeof greenDailyCounter.$inferSelect;
export type NewGreenDailyCounter = typeof greenDailyCounter.$inferInsert;
