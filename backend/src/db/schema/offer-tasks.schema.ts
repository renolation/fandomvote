import { bigint, boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Catalog offer wall (admin cấu hình). Gold thực được cộng qua webhook offerwall postback
// (handleOfferwallPostback) — bảng này CHỈ là danh mục hiển thị, không tự cộng điểm.
export const offerTasks = pgTable('offer_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'), // emoji hiển thị trên tile
  iconBg: text('icon_bg'), // màu nền tile (hex)
  rewardGold: bigint('reward_gold', { mode: 'number' }).notNull(),
  provider: text('provider').notNull().default('INTERNAL'), // nguồn offerwall
  actionUrl: text('action_url'), // nơi nút "Bắt đầu" điều hướng tới
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type OfferTask = typeof offerTasks.$inferSelect;
export type NewOfferTask = typeof offerTasks.$inferInsert;
