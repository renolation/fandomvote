import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { users, verificationTokens } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { addSeconds } from '../../common/utils/time.util';
import { ReferralService } from '../referral/referral.service';

type Channel = 'EMAIL' | 'PHONE';
const OTP_TTL_SECONDS = 15 * 60;

// Verify email/SĐT → set verified_at → kích hoạt referral REWARDED — §11/§9.
@Injectable()
export class VerificationService {
  private readonly logger = new Logger('Verification');

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly referral: ReferralService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Tạo OTP, lưu hash. Prod: gửi qua email/SMS provider. Dev: log (KHÔNG trả token ra response prod).
  async request(userId: string, channel: Channel): Promise<void> {
    const otp = String(randomInt(100000, 1000000)); // 6 chữ số
    await this.db.insert(verificationTokens).values({
      userId,
      channel,
      purpose: channel === 'EMAIL' ? 'VERIFY_EMAIL' : 'VERIFY_PHONE',
      tokenHash: this.hash(otp),
      expiresAt: addSeconds(OTP_TTL_SECONDS),
    });
    this.logger.log(`OTP ${channel} cho user ${userId}: ${otp} (DEV — thay bằng provider thật)`);
  }

  async confirm(userId: string, channel: Channel, otp: string): Promise<void> {
    const tokenHash = this.hash(otp);
    await this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.userId, userId),
            eq(verificationTokens.channel, channel),
            eq(verificationTokens.tokenHash, tokenHash),
            isNull(verificationTokens.consumedAt),
          ),
        )
        .limit(1);
      if (rows.length === 0) throw new BusinessException('TOKEN_INVALID', 'OTP không hợp lệ');
      if (rows[0].expiresAt.getTime() < Date.now()) {
        throw new BusinessException('TOKEN_INVALID', 'OTP hết hạn');
      }
      await tx
        .update(verificationTokens)
        .set({ consumedAt: new Date() })
        .where(eq(verificationTokens.id, rows[0].id));
      await tx
        .update(users)
        .set(channel === 'EMAIL' ? { emailVerifiedAt: new Date() } : { phoneVerifiedAt: new Date() })
        .where(eq(users.id, userId));
      // Referee verify → thưởng referral (cả hai), dưới lock referrer.
      await this.referral.rewardOnVerify(tx, userId);
    });
  }
}
