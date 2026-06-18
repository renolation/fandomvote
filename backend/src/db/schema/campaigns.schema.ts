import { bigint, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { campaignStatusEnum } from './enums';
import { users } from './users.schema';

// State machine — §6. donation_ratio lưu basis points (5000 = 0.5) để tránh float.
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  rulesContent: text('rules_content'), // HTML/markdown — nút "Thể lệ"
  starGoal: bigint('star_goal', { mode: 'number' }).notNull(),
  donationRatioBps: integer('donation_ratio_bps').notNull().default(5000),
  status: campaignStatusEnum('status').notNull().default('DRAFT'),
  openAt: timestamp('open_at', { withTimezone: true }),
  closeAt: timestamp('close_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  snapshottedAt: timestamp('snapshotted_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
