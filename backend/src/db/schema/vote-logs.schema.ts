import { bigint, bigserial, boolean, index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { campaignIdols } from './campaign-idols.schema';
import { campaigns } from './campaigns.schema';
import { currencyEnum } from './enums';
import { users } from './users.schema';

// id bigserial = monotonic → tiebreak first-to-reach — §6.
export const voteLogs = pgTable(
  'vote_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    campaignIdolId: uuid('campaign_idol_id')
      .notNull()
      .references(() => campaignIdols.id),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    currency: currencyEnum('currency').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    realValueVnd: bigint('real_value_vnd', { mode: 'number' }).notNull().default(0),
    runningTotal: bigint('running_total', { mode: 'number' }).notNull(), // total idol sau vote
    isReversal: boolean('is_reversal').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    campaignIdolIdx: index('vote_logs_campaign_idol_idx').on(t.campaignIdolId, t.id),
    userIdx: index('vote_logs_user_idx').on(t.userId, t.id),
  }),
);

export type VoteLog = typeof voteLogs.$inferSelect;
export type NewVoteLog = typeof voteLogs.$inferInsert;
