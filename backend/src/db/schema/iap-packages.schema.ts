import { bigint, boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// Gói nạp Diamond (IAP). Diamond chỉ cộng sau webhook + receipt verify — §0.6.
export const iapPackages = pgTable(
  'iap_packages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: text('sku').notNull(),
    title: text('title').notNull(),
    diamondAmount: bigint('diamond_amount', { mode: 'number' }).notNull(),
    priceVnd: bigint('price_vnd', { mode: 'number' }).notNull(),
    platform: text('platform'), // APPLE | GOOGLE | null (both)
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ skuUq: uniqueIndex('iap_packages_sku_uq').on(t.sku) }),
);

export type IapPackage = typeof iapPackages.$inferSelect;
export type NewIapPackage = typeof iapPackages.$inferInsert;
