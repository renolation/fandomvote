import {
  bigint,
  bigserial,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { campaignIdols } from './campaign-idols.schema';
import { campaigns } from './campaigns.schema';
import { idols } from './idols.schema';

// Immutable — đông cứng leaderboard lúc CLOSED. Resolution chỉ đọc snapshot — §6.
export const campaignSnapshots = pgTable(
  'campaign_snapshots',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    campaignIdolId: uuid('campaign_idol_id')
      .notNull()
      .references(() => campaignIdols.id),
    idolId: uuid('idol_id')
      .notNull()
      .references(() => idols.id),
    rank: integer('rank').notNull(),
    totalVotes: bigint('total_votes', { mode: 'number' }).notNull(),
    reachedValueAt: timestamp('reached_value_at', { withTimezone: true }),
    snapshottedAt: timestamp('snapshotted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uq: uniqueIndex('campaign_snapshots_campaign_idol_uq').on(t.campaignId, t.campaignIdolId),
  }),
);

export type CampaignSnapshot = typeof campaignSnapshots.$inferSelect;
export type NewCampaignSnapshot = typeof campaignSnapshots.$inferInsert;
