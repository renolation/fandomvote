import { bigint, index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns.schema';
import { idols } from './idols.schema';
import { users } from './users.schema';

// Điểm riêng/campaign. total_votes là hot row — lock khi += N — §5.
export const campaignIdols = pgTable(
  'campaign_idols',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    idolId: uuid('idol_id')
      .notNull()
      .references(() => idols.id),
    totalVotes: bigint('total_votes', { mode: 'number' }).notNull().default(0),
    reachedValueAt: timestamp('reached_value_at', { withTimezone: true }), // lúc chạm star_goal
    addedBy: uuid('added_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    campaignIdolUq: uniqueIndex('campaign_idols_campaign_idol_uq').on(t.campaignId, t.idolId),
    leaderboardIdx: index('campaign_idols_leaderboard_idx').on(t.campaignId, t.totalVotes),
  }),
);

export type CampaignIdol = typeof campaignIdols.$inferSelect;
export type NewCampaignIdol = typeof campaignIdols.$inferInsert;
