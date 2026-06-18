import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import { referrals, users } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { addDays } from '../../common/utils/time.util';
import { lockUser } from '../../common/utils/wallet-lock.util';
import { GreenCounterService } from '../wallet/green-counter.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';

const CFG = {
  reward: { key: 'referral.green_reward', def: 500 },
  expiryDays: { key: 'referral.green_expiry_days', def: 7 },
  maxRewarded: { key: 'referral.max_rewarded', def: 50 },
};

// Mã mời = userId. PENDING→REWARDED khi referee verify, dưới lock referrer — §9.
@Injectable()
export class ReferralService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly green: GreenCounterService,
    private readonly config: PlatformConfigService,
  ) {}

  // Gọi trong transaction register. Chống self-referral + referrer tồn tại + 1 referee/record.
  async createPendingReferral(
    tx: DbOrTx,
    referrerId: string,
    refereeId: string,
    signupIp?: string,
    deviceFingerprint?: string,
  ): Promise<void> {
    if (referrerId === refereeId) {
      throw new BusinessException('SELF_REFERRAL', 'Không thể tự giới thiệu');
    }
    const ref = await tx.select({ id: users.id }).from(users).where(eq(users.id, referrerId)).limit(1);
    if (ref.length === 0) {
      throw new BusinessException('NOT_FOUND', 'Mã mời không tồn tại');
    }
    await tx.insert(referrals).values({ referrerId, refereeId, status: 'PENDING', signupIp, deviceFingerprint });
  }

  // Gọi khi referee verify email/SĐT. Referee luôn nhận; referrer nhận nếu chưa đạt trần 50.
  async rewardOnVerify(tx: DbOrTx, refereeId: string): Promise<void> {
    const rows = await tx
      .select()
      .from(referrals)
      .where(and(eq(referrals.refereeId, refereeId), eq(referrals.status, 'PENDING')))
      .limit(1);
    if (rows.length === 0) return; // không có referral pending
    const r = rows[0];

    await lockUser(tx, r.referrerId); // serialize đếm trần referrer
    const reward = await this.config.get<number>(CFG.reward.key, CFG.reward.def);
    const expiryDays = await this.config.get<number>(CFG.expiryDays.key, CFG.expiryDays.def);
    const max = await this.config.get<number>(CFG.maxRewarded.key, CFG.maxRewarded.def);
    const expiresAt = addDays(expiryDays);

    const cnt = await tx
      .select({ c: count() })
      .from(referrals)
      .where(and(eq(referrals.referrerId, r.referrerId), eq(referrals.status, 'REWARDED')));
    const rewardedCount = Number(cnt[0].c);

    // Referee luôn nhận 500 Green (PA-B miễn trần, hạn 7 ngày).
    await this.green.addExemptGreen(tx, refereeId, reward, 'REFERRAL', expiresAt, 'referral', r.id);
    // Referrer chỉ nhận nếu chưa đạt trần lượt mời được thưởng.
    if (rewardedCount < max) {
      await this.green.addExemptGreen(tx, r.referrerId, reward, 'REFERRAL', expiresAt, 'referral', r.id);
    }
    await tx.update(referrals).set({ status: 'REWARDED', rewardedAt: new Date() }).where(eq(referrals.id, r.id));
  }

  async getStats(userId: string) {
    const total = await this.db
      .select({ c: count() })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));
    const rewarded = await this.db
      .select({ c: count() })
      .from(referrals)
      .where(and(eq(referrals.referrerId, userId), eq(referrals.status, 'REWARDED')));
    return {
      referralCode: userId, // mã mời = userId
      totalInvited: Number(total[0].c),
      totalRewarded: Number(rewarded[0].c),
    };
  }
}
