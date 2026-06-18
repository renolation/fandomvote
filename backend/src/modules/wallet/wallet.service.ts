import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, lt } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { walletLedger } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { DIAMOND_TO_GOLD } from '../../common/utils/money.util';
import { lockUser } from '../../common/utils/wallet-lock.util';
import { PaginatedResult, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { Balances, LedgerService } from './ledger.service';

// Service cấp cao — MỞ transaction (§1.2).
@Injectable()
export class WalletService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async getBalances(userId: string): Promise<Balances> {
    return this.ledger.getBalances(this.db, userId);
  }

  // Lịch sử ledger — cursor keyset theo id desc.
  async getHistory(
    userId: string,
    q: PaginationQueryDto,
  ): Promise<PaginatedResult<typeof walletLedger.$inferSelect>> {
    const cursorId = q.cursor ? Number(q.cursor) : undefined;
    const rows = await this.db
      .select()
      .from(walletLedger)
      .where(
        cursorId
          ? and(eq(walletLedger.userId, userId), lt(walletLedger.id, cursorId))
          : eq(walletLedger.userId, userId),
      )
      .orderBy(desc(walletLedger.id))
      .limit(q.limit + 1);

    const hasMore = rows.length > q.limit;
    const items = hasMore ? rows.slice(0, q.limit) : rows;
    return { items, nextCursor: hasMore ? String(items[items.length - 1].id) : null };
  }

  // Đổi Diamond → Gold (một chiều, không hoàn) — §4. 1 Diamond = 1.000 Gold.
  async convertDiamondToGold(
    userId: string,
    diamonds: number,
    idempotencyKey: string,
  ): Promise<Balances> {
    if (!Number.isInteger(diamonds) || diamonds <= 0) {
      throw new BusinessException('VALIDATION_ERROR', 'diamonds phải là số nguyên dương');
    }
    return this.db.transaction(async (tx) => {
      await lockUser(tx, userId);
      const begin = await this.idempotency.begin<Balances>(
        tx,
        idempotencyKey,
        'diamond_to_gold',
        userId,
      );
      if (begin.replay) return begin.response;

      const bal = await this.ledger.getBalances(tx, userId);
      if (bal.diamond < diamonds) {
        throw new BusinessException('INSUFFICIENT_BALANCE', 'Không đủ Diamond');
      }
      const gold = diamonds * DIAMOND_TO_GOLD;
      await this.ledger.debit(tx, {
        userId,
        currency: 'DIAMOND',
        amount: diamonds,
        source: 'DIAMOND_TO_GOLD',
        refType: 'topup',
        refId: idempotencyKey,
      });
      await this.ledger.credit(tx, {
        userId,
        currency: 'GOLD',
        amount: gold,
        source: 'DIAMOND_TO_GOLD',
        realValueVnd: gold, // từ tiền thật
        refType: 'topup',
        refId: idempotencyKey,
      });

      const result = await this.ledger.getBalances(tx, userId);
      await this.idempotency.complete(tx, idempotencyKey, result);
      return result;
    });
  }
}
