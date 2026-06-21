import { bigint, date, integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

// Job nightly đọc ledger → ghi. Source-of-truth tiền ở Postgres — §18.
export const dailyMetrics = pgTable('daily_metrics', {
  metricDate: date('metric_date').primaryKey(),
  dau: integer('dau').notNull().default(0),
  wau: integer('wau').notNull().default(0),
  mau: integer('mau').notNull().default(0),
  newUsers: integer('new_users').notNull().default(0),
  revenueVnd: bigint('revenue_vnd', { mode: 'number' }).notNull().default(0),
  adRevenueGold: bigint('ad_revenue_gold', { mode: 'number' }).notNull().default(0),
  topupDiamond: bigint('topup_diamond', { mode: 'number' }).notNull().default(0),
  goldIssued: bigint('gold_issued', { mode: 'number' }).notNull().default(0),
  goldSpent: bigint('gold_spent', { mode: 'number' }).notNull().default(0),
  goldLiability: bigint('gold_liability', { mode: 'number' }).notNull().default(0),
  greenEarned: bigint('green_earned', { mode: 'number' }).notNull().default(0),
  greenSpent: bigint('green_spent', { mode: 'number' }).notNull().default(0),
  greenExpired: bigint('green_expired', { mode: 'number' }).notNull().default(0),
  totalVotes: bigint('total_votes', { mode: 'number' }).notNull().default(0),
  voteGreen: bigint('vote_green', { mode: 'number' }).notNull().default(0),
  voteGold: bigint('vote_gold', { mode: 'number' }).notNull().default(0),
  eventBonusCost: bigint('event_bonus_cost', { mode: 'number' }).notNull().default(0),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type NewDailyMetric = typeof dailyMetrics.$inferInsert;
