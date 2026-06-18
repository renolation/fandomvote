import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Số nghiệp vụ (ratio, trần, multiplier, hạn, contact). KHÔNG chứa secret — §11/§14.
export const platformConfig = pgTable('platform_config', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PlatformConfigRow = typeof platformConfig.$inferSelect;
export type NewPlatformConfigRow = typeof platformConfig.$inferInsert;
