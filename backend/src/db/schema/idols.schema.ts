import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { idolStatusEnum } from './enums';
import { users } from './users.schema';

// Kho idol — name_normalized UNIQUE để check trùng real-time — §7.
export const idols = pgTable(
  'idols',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    nameNormalized: text('name_normalized').notNull(),
    aliases: text('aliases').array(),
    avatarUrl: text('avatar_url'),
    status: idolStatusEnum('status').notNull().default('PENDING'),
    nominatedBy: uuid('nominated_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameNormalizedUq: uniqueIndex('idols_name_normalized_uq').on(t.nameNormalized),
  }),
);

export type Idol = typeof idols.$inferSelect;
export type NewIdol = typeof idols.$inferInsert;
