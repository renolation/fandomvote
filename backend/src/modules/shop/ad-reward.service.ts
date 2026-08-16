import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, gte, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import { users, walletLedger } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { applyMultiplierBps } from '../../common/utils/money.util';
import { periodRange } from '../../common/utils/time.util';
import { lockUser } from '../../common/utils/wallet-lock.util';
import { AuditService } from '../audit/audit.service';
import { EventsService } from '../events/events.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { ReferralService } from '../referral/referral.service';
import { LedgerService } from '../wallet/ledger.service';
import { UpdateAdConfigDto } from './dto/ad-config.dto';

// Key trong platform_config — admin sửa qua POST /admin/ads/config.
export const AD_CONFIG_KEYS = {
  valueVnd: 'ads.reward_value_vnd',
  ratioBps: 'ads.reward_ratio_bps',
  dailyCap: 'ads.daily_view_cap',
  cooldownSeconds: 'ads.cooldown_seconds',
  rewardedInterstitialGapSeconds: 'ads.rewarded_interstitial_gap_seconds',
  ssvEnabled: 'ads.ssv_enabled',
} as const;

// dailyCap = 0 → KHÔNG giới hạn lượt/ngày (AdMob không áp trần bắt buộc; trần ở đây chỉ để
// khống chế chi phí của chính mình). Tắt hẳn thưởng thì đặt reward_value_vnd hoặc ratio = 0.
// Mặc định 100 lượt/ngày + cách nhau 10s → tối đa 100 × goldPerView mỗi tài khoản/ngày.
export const AD_CONFIG_DEFAULTS = {
  valueVnd: 200,
  ratioBps: 10_000,
  dailyCap: 100,
  cooldownSeconds: 10,
  // Khoảng cách tối thiểu giữa 2 lần MỜI xem rewarded interstitial (sau khi vote).
  // Không phải trần thưởng — chỉ để không hỏi user liên tục.
  rewardedInterstitialGapSeconds: 300,
};

// Bật/tắt từng loại quảng cáo — client đọc từ server nên đổi được mà KHÔNG cần update app.
export const AD_FORMAT_KEYS = {
  rewarded: 'ads.enabled.rewarded',
  rewardedInterstitial: 'ads.enabled.rewarded_interstitial',
  interstitial: 'ads.enabled.interstitial',
  banner: 'ads.enabled.banner',
  appOpen: 'ads.enabled.app_open',
  native: 'ads.enabled.native',
} as const;

export type AdFormat = keyof typeof AD_FORMAT_KEYS;
export type AdFormatFlags = Record<AdFormat, boolean>;

// Chỉ rewarded bật sẵn; các loại khác đã có ad unit nhưng chờ quyết định vị trí hiển thị.
export const AD_FORMAT_DEFAULTS: AdFormatFlags = {
  rewarded: true,
  rewardedInterstitial: false,
  interstitial: false,
  banner: false,
  appOpen: false,
  native: false,
};

export interface AdSettings {
  valueVnd: number; // giá trị 1 lượt xem
  ratioBps: number; // tỉ lệ trả về user (10000 = 100%)
  dailyCap: number; // 0 = không giới hạn
  cooldownSeconds: number;
  rewardedInterstitialGapSeconds: number; // giãn cách giữa 2 lần mời xem sau khi vote
  goldPerView: number; // = valueVnd × ratioBps (1 Gold = 1đ)
  formats: AdFormatFlags;
}

export interface AdStatus extends AdSettings {
  viewsToday: number;
  remainingToday: number | null; // null = không giới hạn
  nextAvailableAt: string | null; // còn cooldown → thời điểm được xem tiếp
}

// Xem rewarded video (AdMob) → Gold. gold = giá 1 lượt xem (VND) × tỉ lệ trả về; 1 Gold = 1đ (như offerwall).
// Ledger source VIDEO → tính vào mốc referral 500 Gold và bảng TOP_EARNER, giống các nguồn earn khác.
//
// ⚠ HIỆN TẠI: cộng Gold khi CLIENT báo đã xem xong (POST /shop/ads/reward) — CHƯA có AdMob SSV.
// Đây là điểm duy nhất trong luồng tiền tin vào client, nên chặn lạm dụng bằng: trần lượt/ngày,
// cooldown giữa 2 lượt, Idempotency-Key, và chặn user bị flag.
// Khi bật SSV: AdMob gọi callback server kèm chữ ký → verify chữ ký rồi cộng, bỏ hẳn đường tin client.
@Injectable()
export class AdRewardService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly config: PlatformConfigService,
    private readonly idempotency: IdempotencyService,
    private readonly ledger: LedgerService,
    private readonly events: EventsService,
    private readonly referral: ReferralService,
    private readonly audit: AuditService,
  ) {}

  async settings(): Promise<AdSettings> {
    const [valueVnd, ratioBps, dailyCap, cooldownSeconds, rewardedInterstitialGapSeconds, formats] = await Promise.all([
      this.config.get<number>(AD_CONFIG_KEYS.valueVnd, AD_CONFIG_DEFAULTS.valueVnd),
      this.config.get<number>(AD_CONFIG_KEYS.ratioBps, AD_CONFIG_DEFAULTS.ratioBps),
      this.config.get<number>(AD_CONFIG_KEYS.dailyCap, AD_CONFIG_DEFAULTS.dailyCap),
      this.config.get<number>(AD_CONFIG_KEYS.cooldownSeconds, AD_CONFIG_DEFAULTS.cooldownSeconds),
      this.config.get<number>(
        AD_CONFIG_KEYS.rewardedInterstitialGapSeconds,
        AD_CONFIG_DEFAULTS.rewardedInterstitialGapSeconds,
      ),
      this.formats(),
    ]);
    return {
      valueVnd,
      ratioBps,
      dailyCap,
      cooldownSeconds,
      rewardedInterstitialGapSeconds,
      goldPerView: applyMultiplierBps(valueVnd, ratioBps),
      formats,
    };
  }

  private async formats(): Promise<AdFormatFlags> {
    const keys = Object.keys(AD_FORMAT_KEYS) as AdFormat[];
    const values = await Promise.all(
      keys.map((f) => this.config.get<boolean>(AD_FORMAT_KEYS[f], AD_FORMAT_DEFAULTS[f])),
    );
    return Object.fromEntries(keys.map((f, i) => [f, values[i]])) as AdFormatFlags;
  }

  // Số lượt đã được cộng Gold trong ngày (UTC+7) + thời điểm lượt gần nhất → dùng cho trần và cooldown.
  // Chỉ đếm source VIDEO (bonus sự kiện ghi source EVENT_BONUS nên không lẫn vào).
  private async viewsToday(tx: DbOrTx, userId: string): Promise<{ count: number; lastAt: Date | null }> {
    const { start } = periodRange('DAY');
    const rows = await tx
      .select({
        count: sql<number>`COUNT(*)`.mapWith(Number),
        lastAt: sql<string | null>`MAX(${walletLedger.createdAt})`,
      })
      .from(walletLedger)
      .where(
        and(
          eq(walletLedger.userId, userId),
          eq(walletLedger.source, 'VIDEO'),
          gt(walletLedger.amount, 0),
          gte(walletLedger.createdAt, start),
        ),
      );
    const lastAt = rows[0]?.lastAt ? new Date(rows[0].lastAt) : null;
    return { count: rows[0]?.count ?? 0, lastAt };
  }

  async status(userId: string): Promise<AdStatus> {
    const s = await this.settings();
    const { count, lastAt } = await this.viewsToday(this.db, userId);
    const next = lastAt ? new Date(lastAt.getTime() + s.cooldownSeconds * 1000) : null;
    return {
      ...s,
      viewsToday: count,
      remainingToday: s.dailyCap > 0 ? Math.max(0, s.dailyCap - count) : null,
      nextAvailableAt: next && next.getTime() > Date.now() ? next.toISOString() : null,
    };
  }

  // Client báo đã xem xong (chưa có SSV). Bật ads.ssv_enabled → chặn đường này để không cộng 2 lần.
  async claim(userId: string, idempotencyKey: string) {
    const ssv = await this.config.get<boolean>(AD_CONFIG_KEYS.ssvEnabled, false);
    if (ssv) {
      throw new BusinessException('AD_SSV_ONLY', 'Gold chỉ được cộng qua xác thực AdMob (SSV)');
    }
    return this.creditView(userId, idempotencyKey, 'ad-reward', true);
  }

  // AdMob SSV: callback ĐÃ verify chữ ký Google → cộng Gold. transaction_id chống replay.
  // Không áp cooldown: lượt xem đã được Google xác thực, chặn ở đây user sẽ mất Gold oan.
  async creditFromSsv(userId: string, transactionId: string) {
    return this.creditView(userId, `admob-ssv:${transactionId}`, 'admob-ssv', false);
  }

  // Đường cộng Gold dùng chung. key vừa là idempotency key vừa là ref_id trong ledger (truy vết được).
  private async creditView(userId: string, key: string, scope: string, enforceCooldown: boolean) {
    const s = await this.settings();
    return this.db.transaction(async (tx) => {
      await lockUser(tx, userId);
      const begin = await this.idempotency.begin<Record<string, unknown>>(tx, key, scope, userId);
      if (begin.replay) return begin.response;

      // Tắt rewarded ở admin, hoặc giá/tỉ lệ = 0 → không cộng, kể cả client cũ vẫn gọi lên.
      // dailyCap = 0 KHÔNG phải tắt, mà là không giới hạn.
      if (!s.formats.rewarded || s.goldPerView <= 0) {
        throw new BusinessException('AD_REWARD_DISABLED', 'Thưởng xem quảng cáo đang tắt');
      }

      const u = await tx.select({ isFlagged: users.isFlagged }).from(users).where(eq(users.id, userId)).limit(1);
      if (u[0]?.isFlagged) throw new BusinessException('ACCOUNT_FLAGGED', 'Tài khoản đang bị khoá nhận thưởng');

      const { count, lastAt } = await this.viewsToday(tx, userId);
      if (s.dailyCap > 0 && count >= s.dailyCap) {
        throw new BusinessException('AD_DAILY_CAP', `Đã đạt trần ${s.dailyCap} lượt xem hôm nay`);
      }
      if (enforceCooldown && lastAt && Date.now() - lastAt.getTime() < s.cooldownSeconds * 1000) {
        throw new BusinessException('AD_COOLDOWN', `Chờ ${s.cooldownSeconds}s trước khi xem lượt tiếp theo`);
      }

      await this.ledger.credit(tx, {
        userId,
        currency: 'GOLD',
        amount: s.goldPerView,
        source: 'VIDEO',
        realValueVnd: s.goldPerView, // 1 Gold = 1đ
        refType: scope,
        refId: key,
      });
      const bonus = await this.events.creditBestBonus(
        tx,
        userId,
        'EARN_MULTIPLIER',
        'GOLD',
        s.goldPerView,
        scope,
        key,
      );
      // Gold-earn → kiểm mốc referral 500 Gold lũy kế (§9).
      await this.referral.onGoldEarned(tx, userId);

      const result = {
        goldAwarded: s.goldPerView,
        bonus,
        viewsToday: count + 1,
        remainingToday: s.dailyCap > 0 ? Math.max(0, s.dailyCap - (count + 1)) : null,
      };
      await this.idempotency.complete(tx, key, result);
      return result;
    });
  }

  // Admin sửa cấu hình — chỉ ghi field được gửi.
  async updateSettings(adminId: string, dto: UpdateAdConfigDto): Promise<AdSettings> {
    const entries: [string, number | undefined, string][] = [
      [AD_CONFIG_KEYS.valueVnd, dto.valueVnd, 'Giá 1 lượt xem rewarded ad (VND)'],
      [AD_CONFIG_KEYS.ratioBps, dto.ratioBps, 'Tỉ lệ Gold trả về user (bps, 10000 = 100%)'],
      [AD_CONFIG_KEYS.dailyCap, dto.dailyCap, 'Trần lượt xem được thưởng mỗi ngày (UTC+7). 0 = không giới hạn'],
      [AD_CONFIG_KEYS.cooldownSeconds, dto.cooldownSeconds, 'Giãn cách tối thiểu giữa 2 lượt xem (giây)'],
      [
        AD_CONFIG_KEYS.rewardedInterstitialGapSeconds,
        dto.rewardedInterstitialGapSeconds,
        'Giãn cách tối thiểu giữa 2 lần mời xem rewarded interstitial (giây)',
      ],
    ];
    for (const [key, value, description] of entries) {
      if (value !== undefined) await this.config.set(key, value, description);
    }

    // Bật/tắt từng loại quảng cáo — chỉ ghi loại được gửi lên.
    for (const f of Object.keys(AD_FORMAT_KEYS) as AdFormat[]) {
      const value = dto.formats?.[f];
      if (value !== undefined) {
        await this.config.set(AD_FORMAT_KEYS[f], value, `Bật quảng cáo loại ${f}`);
      }
    }

    await this.audit.record(adminId, 'ads.config.update', 'platform_config', 'ads');
    return this.settings();
  }
}
