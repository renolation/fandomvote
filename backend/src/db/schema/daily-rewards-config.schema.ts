import { bigint, boolean, integer, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// Cấu hình daily reward theo chuỗi ngày (streak). Seed mặc định — §8.
export const dailyRewardsConfig = pgTable(
  'daily_rewards_config',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dayIndex: integer('day_index').notNull(), // 1..7
    greenAmount: bigint('green_amount', { mode: 'number' }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ dayUq: uniqueIndex('daily_rewards_config_day_uq').on(t.dayIndex) }),
);

export type DailyRewardConfig = typeof dailyRewardsConfig.$inferSelect;
export type NewDailyRewardConfig = typeof dailyRewardsConfig.$inferInsert;
