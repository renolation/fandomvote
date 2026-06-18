import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DbOrTx } from '../../db/types';
import { ledgerSourceEnum, walletLedger } from '../../db/schema';

type Currency = 'GREEN' | 'GOLD' | 'DIAMOND';
type LedgerSource = (typeof ledgerSourceEnum.enumValues)[number];

export interface CreditInput {
  userId: string;
  currency: Currency;
  amount: number; // > 0
  source: LedgerSource;
  expiresAt?: Date | null; // chỉ GREEN
  realValueVnd?: number;
  refType?: string;
  refId?: string;
}

export interface DebitInput {
  userId: string;
  currency: Currency; // GOLD/DIAMOND (Green chỉ trừ qua vote FIFO)
  amount: number; // > 0, lưu thành âm
  source: LedgerSource;
  realValueVnd?: number;
  refType?: string;
  refId?: string;
}

export interface DebitVoteResult {
  greenSpent: number;
  goldSpent: number;
}

export interface Balances {
  green: number;
  gold: number;
  diamond: number;
}

// LedgerService — service phụ: NHẬN tx, KHÔNG tự mở transaction (§1.2). Chỉ INSERT, không UPDATE/DELETE.
@Injectable()
export class LedgerService {
  // credit: cộng (amount > 0). 1 dòng. GREEN có thể mang expires_at (lot).
  async credit(tx: DbOrTx, input: CreditInput): Promise<void> {
    await tx.insert(walletLedger).values({
      userId: input.userId,
      currency: input.currency,
      amount: input.amount,
      source: input.source,
      expiresAt: input.expiresAt ?? null,
      realValueVnd: input.realValueVnd ?? 0,
      refType: input.refType,
      refId: input.refId,
    });
  }

  // debit chung cho GOLD/DIAMOND (không lot). amount>0 → lưu âm. Caller tự check số dư khi cần.
  async debit(tx: DbOrTx, input: DebitInput): Promise<void> {
    await tx.insert(walletLedger).values({
      userId: input.userId,
      currency: input.currency,
      amount: -Math.abs(input.amount),
      source: input.source,
      expiresAt: null,
      realValueVnd: input.realValueVnd ?? 0,
      refType: input.refType,
      refId: input.refId,
    });
  }

  // Balance từng loại — Green chỉ tính lot chưa hết hạn (lazy expiration §4).
  async getBalances(tx: DbOrTx, userId: string): Promise<Balances> {
    const res = await tx.execute(sql`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE currency = 'GREEN'
          AND (expires_at IS NULL OR expires_at > now())), 0) AS green,
        COALESCE(SUM(amount) FILTER (WHERE currency = 'GOLD'), 0) AS gold,
        COALESCE(SUM(amount) FILTER (WHERE currency = 'DIAMOND'), 0) AS diamond
      FROM wallet_ledger WHERE user_id = ${userId}
    `);
    const row = res.rows[0] as { green: string; gold: string; diamond: string };
    return { green: Number(row.green), gold: Number(row.gold), diamond: Number(row.diamond) };
  }

  // Trừ cho vote: GREEN trước (FIFO theo expiry sớm nhất) → GOLD sau. Caller đã lockUser + check đủ số dư.
  // FIFO lot-attribution: mỗi lot 1 dòng debit mang expires_at=lot + consumes_ledger_id (§4 — chống balance âm).
  async debitForVote(
    tx: DbOrTx,
    userId: string,
    amount: number,
    refType: string,
    refId: string,
  ): Promise<DebitVoteResult> {
    let need = amount;
    let greenSpent = 0;

    const lots = await tx.execute(sql`
      SELECT l.id, l.expires_at,
        (l.amount + COALESCE((SELECT SUM(d.amount) FROM wallet_ledger d
          WHERE d.consumes_ledger_id = l.id), 0)) AS remaining
      FROM wallet_ledger l
      WHERE l.user_id = ${userId} AND l.currency = 'GREEN' AND l.amount > 0
        AND (l.expires_at IS NULL OR l.expires_at > now())
      GROUP BY l.id, l.amount, l.expires_at
      HAVING (l.amount + COALESCE((SELECT SUM(d.amount) FROM wallet_ledger d
        WHERE d.consumes_ledger_id = l.id), 0)) > 0
      ORDER BY l.expires_at ASC NULLS LAST, l.id ASC
    `);

    for (const raw of lots.rows as Array<{ id: string; expires_at: string | Date | null; remaining: string }>) {
      if (need <= 0) break;
      const remaining = Number(raw.remaining);
      const take = Math.min(remaining, need);
      // tx.execute trả timestamptz dạng string → ép Date cho drizzle insert.
      const lotExpiresAt = raw.expires_at ? new Date(raw.expires_at) : null;
      await tx.insert(walletLedger).values({
        userId,
        currency: 'GREEN',
        amount: -take, // âm
        source: 'VOTE',
        expiresAt: lotExpiresAt, // KHỚP lot bị tiêu
        realValueVnd: 0, // Green vào quỹ = 0
        refType,
        refId,
        consumesLedgerId: Number(raw.id),
      });
      greenSpent += take;
      need -= take;
    }

    let goldSpent = 0;
    if (need > 0) {
      goldSpent = need;
      await tx.insert(walletLedger).values({
        userId,
        currency: 'GOLD',
        amount: -need,
        source: 'VOTE',
        expiresAt: null,
        realValueVnd: need, // Gold vào quỹ = amount (1 Gold = 1đ)
        refType,
        refId,
      });
    }

    return { greenSpent, goldSpent };
  }
}
