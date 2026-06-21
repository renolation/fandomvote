import {
  bigint,
  bigserial,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { leaderboardPeriodEnum, leaderboardTypeEnum, rewardStatusEnum } from './enums';
import { users } from './users.schema';

// Snapshot top N mỗi kỳ; admin duyệt reward_status trước khi trao — §17. Immutable.
export const leaderboardSnapshots = pgTable(
  'leaderboard_snapshots',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    boardType: leaderboardTypeEnum('board_type').notNull(),
    period: leaderboardPeriodEnum('period').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    rank: integer('rank').notNull(),
    score: bigint('score', { mode: 'number' }).notNull(),
    rewardStatus: rewardStatusEnum('reward_status').notNull().default('PENDING'),
    rewardConfig: jsonb('reward_config'),
    grantedAt: timestamp('granted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uq: uniqueIndex('leaderboard_snapshots_uq').on(t.boardType, t.period, t.periodStart, t.rank),
  }),
);

export type LeaderboardSnapshot = typeof leaderboardSnapshots.$inferSelect;
export type NewLeaderboardSnapshot = typeof leaderboardSnapshots.$inferInsert;
