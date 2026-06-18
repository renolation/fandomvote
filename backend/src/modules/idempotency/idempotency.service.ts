import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DbOrTx } from '../../db/types';
import { idempotencyKeys } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { addSeconds } from '../../common/utils/time.util';

type BeginResult<T> = { replay: false } | { replay: true; response: T };

const DEFAULT_TTL_SECONDS = 48 * 60 * 60; // vote/redeem ~48h
export const WEBHOOK_TTL_SECONDS = 90 * 24 * 60 * 60; // webhook ~90d chống replay

// §10 — chạy SAU lockUser, trong cùng transaction. Insert-block + advisory lock cùng serialize race.
@Injectable()
export class IdempotencyService {
  async begin<T = unknown>(
    tx: DbOrTx,
    key: string,
    scope: string,
    userId?: string,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<BeginResult<T>> {
    // ON CONFLICT DO NOTHING: KHÔNG raise 23505 → không abort transaction.
    // Trùng key đang PENDING ở txn khác → block tới khi txn đó commit/rollback (serialize race).
    const inserted = await tx
      .insert(idempotencyKeys)
      .values({
        key,
        scope,
        userId: userId ?? null,
        status: 'PENDING',
        expiresAt: addSeconds(ttlSeconds),
      })
      .onConflictDoNothing()
      .returning({ key: idempotencyKeys.key });

    if (inserted.length > 0) return { replay: false };

    const row = await tx
      .select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key))
      .limit(1);
    if (row.length && row[0].status === 'DONE') {
      return { replay: true, response: row[0].responseJson as T };
    }
    // Đang xử lý ở request khác → client retry sau.
    throw new BusinessException('IN_PROGRESS', 'Yêu cầu đang được xử lý, thử lại sau');
  }

  async complete(tx: DbOrTx, key: string, response: unknown): Promise<void> {
    await tx
      .update(idempotencyKeys)
      .set({ status: 'DONE', responseJson: response as object })
      .where(eq(idempotencyKeys.key, key));
  }
}
