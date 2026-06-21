import { bigserial, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Mirror tối thiểu event hành vi (chi tiết engagement ở tool ngoài) — §18.
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id'),
    sessionId: text('session_id'),
    eventName: text('event_name').notNull(),
    props: jsonb('props'),
    platform: text('platform'), // web | mobile
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ nameIdx: index('analytics_events_name_idx').on(t.eventName, t.createdAt) }),
);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
