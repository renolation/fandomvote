import { bigserial, date, integer, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';

// Retention theo cohort ngày đăng ký — §18.
export const cohortRetention = pgTable(
  'cohort_retention',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    cohortDate: date('cohort_date').notNull(),
    dayOffset: integer('day_offset').notNull(), // 1 / 7 / 30
    retainedUsers: integer('retained_users').notNull().default(0),
    cohortSize: integer('cohort_size').notNull().default(0),
  },
  (t) => ({ uq: uniqueIndex('cohort_retention_uq').on(t.cohortDate, t.dayOffset) }),
);

export type CohortRetention = typeof cohortRetention.$inferSelect;
export type NewCohortRetention = typeof cohortRetention.$inferInsert;
