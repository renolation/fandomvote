import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idempotencyStatusEnum } from './enums';

// §10 — vote/topup/redeem/webhook. Unique key chống double-spend khi race.
export const idempotencyKeys = pgTable('idempotency_keys', {
  key: text('key').primaryKey(),
  userId: uuid('user_id'),
  scope: text('scope').notNull(),
  status: idempotencyStatusEnum('status').notNull().default('PENDING'),
  responseJson: jsonb('response_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type NewIdempotencyKey = typeof idempotencyKeys.$inferInsert;
