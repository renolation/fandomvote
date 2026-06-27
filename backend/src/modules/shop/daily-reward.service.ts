import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { dailyRewardsConfig, greenDailyCounter } from '../../db/schema';
import { vnDateString } from '../../common/utils/time.util';
import { lockUser } from '../../common/utils/wallet-lock.util';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { GreenCounterService } from '../wallet/green-counter.service';

// Daily reward: check-in 1 lần/ngày → Green (tính trần) — §8.
// Streak đơn giản hóa: dùng cấu hình day_index nhỏ nhất đang active (mở rộng streak sau).
@Injectable()
export class DailyRewardService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly green: GreenCounterService,
    private readonly config: PlatformConfigService,
  ) {}

  async claim(userId: string): Promise<{ greenAwarded: number }> {
    return this.db.transaction(async (tx) => {
      await lockUser(tx, userId);
      await this.green.claimCheckin(tx, userId); // ALREADY_CLAIMED nếu đã nhận hôm nay

      const rows = await tx
        .select()
        .from(dailyRewardsConfig)
        .where(eq(dailyRewardsConfig.isActive, true))
        .orderBy(asc(dailyRewardsConfig.dayIndex))
        .limit(1);
      const amount = rows.length
        ? rows[0].greenAmount
        : await this.config.get<number>('daily.checkin_green', 50);

      await this.green.earnCappedGreen(tx, userId, amount, 'CHECKIN', 'daily-reward', userId);
      return { greenAwarded: amount };
    });
  }

  async listConfig() {
    return this.db
      .select()
      .from(dailyRewardsConfig)
      .where(eq(dailyRewardsConfig.isActive, true))
      .orderBy(asc(dailyRewardsConfig.dayIndex));
  }

  // Trạng thái điểm danh hôm nay (UTC+7) của user → FE tô màu ô + khoá nút.
  async status(userId: string): Promise<{ claimedToday: boolean }> {
    const date = vnDateString();
    const rows = await this.db
      .select({ at: greenDailyCounter.checkinClaimedAt })
      .from(greenDailyCounter)
      .where(and(eq(greenDailyCounter.userId, userId), eq(greenDailyCounter.date, date)))
      .limit(1);
    return { claimedToday: !!rows[0]?.at };
  }
}
