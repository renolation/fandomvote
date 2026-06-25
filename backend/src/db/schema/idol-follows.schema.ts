import { pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { idols } from './idols.schema';
import { users } from './users.schema';

// Theo dõi idol — mỗi user theo dõi mỗi idol tối đa 1 lần (UNIQUE) để follow idempotent.
export const idolFollows = pgTable(
  'idol_follows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    idolId: uuid('idol_id')
      .notNull()
      .references(() => idols.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdolUq: uniqueIndex('idol_follows_user_idol_uq').on(t.userId, t.idolId),
  }),
);

export type IdolFollow = typeof idolFollows.$inferSelect;
export type NewIdolFollow = typeof idolFollows.$inferInsert;
