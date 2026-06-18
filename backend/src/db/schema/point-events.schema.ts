import { bigint, boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pointEventTypeEnum } from './enums';

// Trùng giờ KHÔNG cộng dồn → lấy multiplier cao nhất theo priority — §8.
// multiplier lưu basis points (20000 = x2.0). Trần bonus tránh lạm phát.
export const pointEvents = pgTable('point_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  type: pointEventTypeEnum('type').notNull(),
  multiplierBps: integer('multiplier_bps').notNull(), // 20000 = x2
  priority: integer('priority').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  maxBonusPerUser: bigint('max_bonus_per_user', { mode: 'number' }),
  maxBonusTotal: bigint('max_bonus_total', { mode: 'number' }),
  bonusTotalUsed: bigint('bonus_total_used', { mode: 'number' }).notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PointEvent = typeof pointEvents.$inferSelect;
export type NewPointEvent = typeof pointEvents.$inferInsert;
