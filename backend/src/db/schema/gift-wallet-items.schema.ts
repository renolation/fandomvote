import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { giftItemStatusEnum, giftItemTypeEnum } from './enums';
import { shopDeals } from './shop-deals.schema';
import { shippingAddresses } from './shipping-addresses.schema';
import { users } from './users.schema';

// Lazy expiration. DIGITAL: ACTIVE→USED→EXPIRED. PHYSICAL: PENDING→...→DELIVERED — §8.
export const giftWalletItems = pgTable(
  'gift_wallet_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    dealId: uuid('deal_id')
      .notNull()
      .references(() => shopDeals.id),
    itemType: giftItemTypeEnum('item_type').notNull(),
    status: giftItemStatusEnum('status').notNull(),
    code: text('code'), // mã/QR digital
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    shippingAddressId: uuid('shipping_address_id').references(() => shippingAddresses.id),
    usedAt: timestamp('used_at', { withTimezone: true }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index('gift_wallet_items_user_idx').on(t.userId, t.status) }),
);

export type GiftWalletItem = typeof giftWalletItems.$inferSelect;
export type NewGiftWalletItem = typeof giftWalletItems.$inferInsert;
