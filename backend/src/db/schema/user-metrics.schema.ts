import { bigint, boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// 1 dòng/user — lifetime_gold_earned dùng chung điều kiện referral (§9/§18).
export const userMetrics = pgTable('user_metrics', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstSeen: timestamp('first_seen', { withTimezone: true }),
  lastSeen: timestamp('last_seen', { withTimezone: true }),
  lifetimeGoldEarned: bigint('lifetime_gold_earned', { mode: 'number' }).notNull().default(0),
  lifetimeSpendVnd: bigint('lifetime_spend_vnd', { mode: 'number' }).notNull().default(0),
  totalTopupVnd: bigint('total_topup_vnd', { mode: 'number' }).notNull().default(0),
  totalVotes: bigint('total_votes', { mode: 'number' }).notNull().default(0),
  isPaying: boolean('is_paying').notNull().default(false),
  ltvVnd: bigint('ltv_vnd', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UserMetric = typeof userMetrics.$inferSelect;
export type NewUserMetric = typeof userMetrics.$inferInsert;
