import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DbOrTx } from '../../db/types';
import { greenDailyCounter, ledgerSourceEnum } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { addDays, vnDateString, vnEndOfDay } from '../../common/utils/time.util';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { LedgerService } from './ledger.service';

type LedgerSource = (typeof ledgerSourceEnum.enumValues)[number];

const GREEN_DAILY_CAP_KEY = 'green.daily_cap';
const GREEN_DAILY_CAP_DEFAULT = 100;

// Trần Green earned/ngày (UTC+7). 1 row/(user,ngày) — không reset (§17). Caller phải lockUser trước.
@Injectable()
export class GreenCounterService {
  constructor(
    private readonly ledger: LedgerService,
    private readonly config: PlatformConfigService,
  ) {}

  // Green TÍNH trần (checkin, daily reward, task green...). Hạn cuối ngày UTC+7.
  async earnCappedGreen(
    tx: DbOrTx,
    userId: string,
    amount: number,
    source: LedgerSource,
    refType?: string,
    refId?: string,
  ): Promise<void> {
    const cap = await this.config.get<number>(GREEN_DAILY_CAP_KEY, GREEN_DAILY_CAP_DEFAULT);
    const date = vnDateString();
    const cur = await tx
      .select()
      .from(greenDailyCounter)
      .where(and(eq(greenDailyCounter.userId, userId), eq(greenDailyCounter.date, date)))
      .limit(1);
    const earned = cur.length ? cur[0].greenEarnedToday : 0;
    if (earned + amount > cap) {
      throw new BusinessException('GREEN_CAP_EXCEEDED', `Vượt trần ${cap} Green/ngày`);
    }
    if (cur.length) {
      await tx
        .update(greenDailyCounter)
        .set({ greenEarnedToday: earned + amount })
        .where(and(eq(greenDailyCounter.userId, userId), eq(greenDailyCounter.date, date)));
    } else {
      await tx.insert(greenDailyCounter).values({ userId, date, greenEarnedToday: amount });
    }
    await this.ledger.credit(tx, {
      userId,
      currency: 'GREEN',
      amount,
      source,
      expiresAt: vnEndOfDay(),
      refType,
      refId,
    });
  }

  // Green MIỄN trần (referral PA-B, refund vote) — không cộng green_earned_today (§9/§5).
  async addExemptGreen(
    tx: DbOrTx,
    userId: string,
    amount: number,
    source: LedgerSource,
    expiresAt: Date,
    refType?: string,
    refId?: string,
  ): Promise<void> {
    await this.ledger.credit(tx, {
      userId,
      currency: 'GREEN',
      amount,
      source,
      expiresAt,
      refType,
      refId,
    });
  }

  // Check-in 1 lần/ngày — set cờ + ngày thứ mấy trong chuỗi, đã set → ALREADY_CLAIMED (§16).
  async claimCheckin(tx: DbOrTx, userId: string, dayIndex: number): Promise<void> {
    const date = vnDateString();
    const cur = await tx
      .select()
      .from(greenDailyCounter)
      .where(and(eq(greenDailyCounter.userId, userId), eq(greenDailyCounter.date, date)))
      .limit(1);
    if (cur.length && cur[0].checkinClaimedAt) {
      throw new BusinessException('ALREADY_CLAIMED', 'Đã điểm danh hôm nay');
    }
    if (cur.length) {
      await tx
        .update(greenDailyCounter)
        .set({ checkinClaimedAt: new Date(), checkinDayIndex: dayIndex })
        .where(and(eq(greenDailyCounter.userId, userId), eq(greenDailyCounter.date, date)));
    } else {
      await tx.insert(greenDailyCounter).values({
        userId,
        date,
        greenEarnedToday: 0,
        checkinClaimedAt: new Date(),
        checkinDayIndex: dayIndex,
      });
    }
  }

  // Ngày chuỗi kế tiếp của user: row hôm qua có check-in → +1 (hết chu kỳ thì quay về 1); ngắt → 1.
  async nextStreakDay(tx: DbOrTx, userId: string, maxDay: number): Promise<number> {
    const yesterday = vnDateString(addDays(-1));
    const rows = await tx
      .select({ day: greenDailyCounter.checkinDayIndex, at: greenDailyCounter.checkinClaimedAt })
      .from(greenDailyCounter)
      .where(and(eq(greenDailyCounter.userId, userId), eq(greenDailyCounter.date, yesterday)))
      .limit(1);
    if (!rows.length || !rows[0].at) return 1; // hôm qua không điểm danh → chuỗi đứt
    const prev = rows[0].day ?? 1;
    return prev >= maxDay ? 1 : prev + 1; // hết chu kỳ → vòng lại ngày 1
  }
}
