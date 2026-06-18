import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { referralStatusEnum } from './enums';
import { users } from './users.schema';

// 1 referee = 1 record (unique). PENDING→REWARDED khi referee verify — §9.
export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referrerId: uuid('referrer_id')
      .notNull()
      .references(() => users.id),
    refereeId: uuid('referee_id')
      .notNull()
      .references(() => users.id),
    status: referralStatusEnum('status').notNull().default('PENDING'),
    signupIp: text('signup_ip'),
    deviceFingerprint: text('device_fingerprint'),
    rewardedAt: timestamp('rewarded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    refereeUq: uniqueIndex('referrals_referee_uq').on(t.refereeId),
    referrerIdx: index('referrals_referrer_idx').on(t.referrerId, t.status),
  }),
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
