import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import { referrals, users } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { LedgerService } from '../wallet/ledger.service';

const CFG = {
  goldReward: { key: 'referral.gold_reward', def: 500 },
  goldThreshold: { key: 'referral.gold_threshold', def: 500 },
};
// Gold earn tính mốc lũy kế (không gồm topup/diamond/referral/reward).
const EARN_SOURCES = "('VIDEO','OFFERWALL','TASK')";

// Mã mời = userId. Thưởng 500 GOLD CHO CẢ HAI khi referee tự kiếm 500 Gold lũy kế — §9 (INSTRUCTION mới).
@Injectable()
export class ReferralService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
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
    if (ref.length === 0) throw new BusinessException('NOT_FOUND', 'Mã mời không tồn tại');
    await tx.insert(referrals).values({ referrerId, refereeId, status: 'PENDING', signupIp, deviceFingerprint });
  }

  // Lũy kế Gold tự kiếm của 1 user (VIDEO/OFFERWALL/TASK, amount > 0).
  private async lifetimeEarnedGold(tx: DbOrTx, userId: string): Promise<number> {
    const res = await tx.execute(sql`
      SELECT COALESCE(SUM(amount), 0) AS s FROM wallet_ledger
      WHERE user_id = ${userId} AND currency = 'GOLD' AND amount > 0
        AND source IN ${sql.raw(EARN_SOURCES)}
    `);
    return Number((res.rows[0] as { s: string }).s);
  }

  // Gọi NGAY SAU khi referee được cộng Gold-earn (offerwall/video/task). Idempotent: release đúng 1 lần.
  async onGoldEarned(tx: DbOrTx, refereeId: string): Promise<void> {
    const rows = await tx
      .select()
      .from(referrals)
      .where(and(eq(referrals.refereeId, refereeId), eq(referrals.status, 'PENDING')))
      .limit(1);
    if (rows.length === 0) return; // không có referral PENDING
    const r = rows[0];

    const earned = await this.lifetimeEarnedGold(tx, refereeId);
    await tx.update(referrals).set({ refereeGoldEarned: earned }).where(eq(referrals.id, r.id));

    const threshold = await this.config.get<number>(CFG.goldThreshold.key, CFG.goldThreshold.def);
    if (earned < threshold) return;

    // CAS: chỉ txn THẮNG mới release (row lock trên referral chống double-release, không cần advisory lock referrer).
    const won = await tx
      .update(referrals)
      .set({ status: 'REWARDED', rewardedAt: new Date() })
      .where(and(eq(referrals.id, r.id), eq(referrals.status, 'PENDING')))
      .returning({ id: referrals.id });
    if (won.length === 0) return;

    const reward = await this.config.get<number>(CFG.goldReward.key, CFG.goldReward.def);
    for (const uid of [r.referrerId, refereeId]) {
      await this.ledger.credit(tx, {
        userId: uid,
        currency: 'GOLD',
        amount: reward,
        source: 'REFERRAL',
        realValueVnd: reward, // 1 Gold = 1đ
        refType: 'referral',
        refId: r.id,
      });
    }
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
