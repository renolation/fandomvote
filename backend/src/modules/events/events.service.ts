import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import { PointEvent, pointEvents } from '../../db/schema';
import { bonusFromMultiplierBps } from '../../common/utils/money.util';
import { LedgerService } from '../wallet/ledger.service';

type Currency = 'GREEN' | 'GOLD' | 'DIAMOND';
type EventType = PointEvent['type'];

// Point events: trùng giờ KHÔNG cộng dồn → multiplier cao nhất theo priority, trần bonus — §8.
@Injectable()
export class EventsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
  ) {}

  async getActive(type?: EventType): Promise<PointEvent[]> {
    const nowTs = new Date();
    const conds = [
      eq(pointEvents.isActive, true),
      lte(pointEvents.startsAt, nowTs),
      gte(pointEvents.endsAt, nowTs),
    ];
    if (type) conds.push(eq(pointEvents.type, type));
    return this.db
      .select()
      .from(pointEvents)
      .where(and(...conds))
      .orderBy(desc(pointEvents.priority), desc(pointEvents.multiplierBps));
  }

  // Tính + ghi bonus (dòng EVENT_BONUS riêng) cho 1 giao dịch base. Tôn trọng trần per-user/total.
  // Gọi trong transaction sau khi đã credit base.
  async creditBestBonus(
    tx: DbOrTx,
    userId: string,
    type: EventType,
    currency: Currency,
    baseAmount: number,
    refType: string,
    refId: string,
  ): Promise<number> {
    const nowTs = new Date();
    const evs = await tx
      .select()
      .from(pointEvents)
      .where(
        and(
          eq(pointEvents.type, type),
          eq(pointEvents.isActive, true),
          lte(pointEvents.startsAt, nowTs),
          gte(pointEvents.endsAt, nowTs),
        ),
      )
      .orderBy(desc(pointEvents.priority), desc(pointEvents.multiplierBps))
      .limit(1)
      .for('update'); // lock event row → trần total chính xác
    if (evs.length === 0) return 0;
    const ev = evs[0];

    let bonus = bonusFromMultiplierBps(baseAmount, ev.multiplierBps);
    if (bonus <= 0) return 0;

    if (ev.maxBonusPerUser != null) {
      const used = await tx.execute(sql`
        SELECT COALESCE(SUM(amount), 0) AS s FROM wallet_ledger
        WHERE user_id = ${userId} AND source = 'EVENT_BONUS' AND ref_id = ${ev.id}
      `);
      const userUsed = Number((used.rows[0] as { s: string }).s);
      bonus = Math.min(bonus, ev.maxBonusPerUser - userUsed);
    }
    if (ev.maxBonusTotal != null) {
      bonus = Math.min(bonus, ev.maxBonusTotal - ev.bonusTotalUsed);
    }
    if (bonus <= 0) return 0;

    await this.ledger.credit(tx, {
      userId,
      currency,
      amount: bonus,
      source: 'EVENT_BONUS',
      realValueVnd: currency === 'GOLD' ? bonus : 0,
      refType,
      refId,
    });
    await tx
      .update(pointEvents)
      .set({ bonusTotalUsed: ev.bonusTotalUsed + bonus })
      .where(eq(pointEvents.id, ev.id));
    return bonus;
  }
}
