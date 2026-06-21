import { bigint, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns.schema';
import { users } from './users.schema';

// PER-USER + IMMUTABLE — mỗi voter Gold 1 biên lai (§6/§12). Σ donatedVnd = quỹ campaign.
export const donationReceipts = pgTable(
  'donation_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    goldVoted: bigint('gold_voted', { mode: 'number' }).notNull(),
    donatedVnd: bigint('donated_vnd', { mode: 'number' }).notNull(),
    donationRatioBps: integer('donation_ratio_bps').notNull(),
    receiptNo: text('receipt_no').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    campaignUserUq: uniqueIndex('donation_receipts_campaign_user_uq').on(t.campaignId, t.userId),
    receiptNoUq: uniqueIndex('donation_receipts_no_uq').on(t.receiptNo),
  }),
);

export type DonationReceipt = typeof donationReceipts.$inferSelect;
export type NewDonationReceipt = typeof donationReceipts.$inferInsert;
