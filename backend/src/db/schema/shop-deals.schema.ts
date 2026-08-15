import { bigint, boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { currencyEnum, giftItemTypeEnum } from './enums';
import { partners } from './partners.schema';

// Redeem ATOMIC: lock row → stock_sold < stock → trừ điểm → stock_sold += 1 — §8.
// 1 loại tiền/deal (GOLD hoặc DIAMOND).
export const shopDeals = pgTable('shop_deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'), // ảnh quà (R2). NULL → client vẽ ô màu theo id.
  partnerId: uuid('partner_id').references(() => partners.id),
  cost: bigint('cost', { mode: 'number' }).notNull(),
  currency: currencyEnum('currency').notNull(), // chỉ GOLD | DIAMOND hợp lệ
  itemType: giftItemTypeEnum('item_type').notNull(),
  stock: integer('stock').notNull(),
  stockSold: integer('stock_sold').notNull().default(0),
  validityDays: integer('validity_days'), // hạn gift item
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ShopDeal = typeof shopDeals.$inferSelect;
export type NewShopDeal = typeof shopDeals.$inferInsert;
