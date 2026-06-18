import { bigint, integer, pgTable, jsonb, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns.schema';

// IMMUTABLE — chỉ INSERT. Quỹ = floor(Σ GOLD × ratio). 1 campaign = 1 receipt — §6/§12.
export const donationReceipts = pgTable(
  'donation_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    fundVnd: bigint('fund_vnd', { mode: 'number' }).notNull(),
    goldTotal: bigint('gold_total', { mode: 'number' }).notNull(),
    donationRatioBps: integer('donation_ratio_bps').notNull(),
    receiptNo: text('receipt_no').notNull(),
    details: jsonb('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    campaignUq: uniqueIndex('donation_receipts_campaign_uq').on(t.campaignId),
    receiptNoUq: uniqueIndex('donation_receipts_no_uq').on(t.receiptNo),
  }),
);

export type DonationReceipt = typeof donationReceipts.$inferSelect;
export type NewDonationReceipt = typeof donationReceipts.$inferInsert;
