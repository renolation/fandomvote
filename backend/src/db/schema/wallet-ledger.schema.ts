import { bigint, bigserial, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { currencyEnum, ledgerSourceEnum } from './enums';
import { users } from './users.schema';

// Ví = ledger. KHÔNG có cột balance. Balance = SUM(amount). Append-only — §0.2.
// FIFO lot Green: debit Green mang expires_at = lot bị tiêu + consumes_ledger_id — §4.
export const walletLedger = pgTable(
  'wallet_ledger',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    currency: currencyEnum('currency').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(), // +credit / -debit, integer
    source: ledgerSourceEnum('source').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }), // chỉ GREEN
    realValueVnd: bigint('real_value_vnd', { mode: 'number' }).notNull().default(0),
    refType: text('ref_type'),
    refId: text('ref_id'),
    consumesLedgerId: bigint('consumes_ledger_id', { mode: 'number' }), // FIFO lot Green debit
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // balance per currency + FIFO lot scan (expires_at)
    balanceIdx: index('wallet_ledger_balance_idx').on(t.userId, t.currency, t.expiresAt),
    consumesIdx: index('wallet_ledger_consumes_idx').on(t.consumesLedgerId),
  }),
);

export type WalletLedgerRow = typeof walletLedger.$inferSelect;
export type NewWalletLedgerRow = typeof walletLedger.$inferInsert;
