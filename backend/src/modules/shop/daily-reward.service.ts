import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import { dailyRewardsConfig, greenDailyCounter } from '../../db/schema';
import { vnDateString } from '../../common/utils/time.util';
import { lockUser } from '../../common/utils/wallet-lock.util';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { GreenCounterService } from '../wallet/green-counter.service';

// Daily reward: check-in 1 lần/ngày → Green (tính trần) — §8.
// Streak: chuỗi ngày liên tiếp (UTC+7). Điểm danh hôm qua → tiến 1 bậc; bỏ 1 ngày → về ngày 1;
// hết chu kỳ (day_index lớn nhất) → vòng lại ngày 1.
@Injectable()
export class DailyRewardService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly green: GreenCounterService,
    private readonly config: PlatformConfigService,
  ) {}

  async claim(userId: string): Promise<{ greenAwarded: number; dayIndex: number }> {
    return this.db.transaction(async (tx) => {
      await lockUser(tx, userId);

      const tiers = await this.activeTiers(tx);
      const maxDay = tiers.length ? tiers[tiers.length - 1].dayIndex : 1;
      const dayIndex = await this.green.nextStreakDay(tx, userId, maxDay);

      await this.green.claimCheckin(tx, userId, dayIndex); // ALREADY_CLAIMED nếu đã nhận hôm nay

      // Mốc đúng ngày chuỗi; thiếu cấu hình → mốc nhỏ nhất, cuối cùng mới tới platform config.
      const tier = tiers.find((t) => t.dayIndex === dayIndex) ?? tiers[0];
      const amount = tier
        ? tier.greenAmount
        : await this.config.get<number>('daily.checkin_green', 50);

      await this.green.earnCappedGreen(tx, userId, amount, 'CHECKIN', 'daily-reward', userId);
      return { greenAwarded: amount, dayIndex };
    });
  }

  private activeTiers(tx: DbOrTx) {
    return tx
      .select()
      .from(dailyRewardsConfig)
      .where(eq(dailyRewardsConfig.isActive, true))
      .orderBy(asc(dailyRewardsConfig.dayIndex));
  }

  async listConfig() {
    return this.activeTiers(this.db);
  }

  // Trạng thái điểm danh hôm nay (UTC+7) → FE tô ô đúng ngày chuỗi + khoá nút.
  // dayIndex = ngày đã nhận hôm nay, hoặc ngày sẽ nhận nếu điểm danh bây giờ.
  async status(userId: string): Promise<{ claimedToday: boolean; dayIndex: number }> {
    const date = vnDateString();
    const rows = await this.db
      .select({ at: greenDailyCounter.checkinClaimedAt, day: greenDailyCounter.checkinDayIndex })
      .from(greenDailyCounter)
      .where(and(eq(greenDailyCounter.userId, userId), eq(greenDailyCounter.date, date)))
      .limit(1);

    if (rows[0]?.at) return { claimedToday: true, dayIndex: rows[0].day ?? 1 };

    const tiers = await this.activeTiers(this.db);
    const maxDay = tiers.length ? tiers[tiers.length - 1].dayIndex : 1;
    return { claimedToday: false, dayIndex: await this.green.nextStreakDay(this.db, userId, maxDay) };
  }
}
