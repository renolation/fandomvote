import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { verificationChannelEnum, verificationPurposeEnum } from './enums';
import { users } from './users.schema';

// Verify email/SĐT → kích hoạt referral REWARDED — §11.
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: verificationChannelEnum('channel').notNull(),
    purpose: verificationPurposeEnum('purpose').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index('verification_tokens_user_idx').on(t.userId) }),
);

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
