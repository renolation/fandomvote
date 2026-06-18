import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { users } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { DIAMOND_TO_GOLD } from '../../common/utils/money.util';
import { lockUser } from '../../common/utils/wallet-lock.util';
import { IdempotencyService, WEBHOOK_TTL_SECONDS } from '../idempotency/idempotency.service';
import { EventsService } from '../events/events.service';
import { LedgerService } from '../wallet/ledger.service';
import { IapWebhookDto, OfferwallPostbackDto } from './dto/webhook.dto';

// Verify TRƯỚC khi cộng tiền + chống replay theo transaction_id — §0.6/§10.
@Injectable()
export class WebhookService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly config: ConfigService,
    private readonly idempotency: IdempotencyService,
    private readonly ledger: LedgerService,
    private readonly events: EventsService,
  ) {}

  private verify(secret: string, message: string, signature: string): void {
    const expected = createHmac('sha256', secret).update(message).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature ?? '');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BusinessException('SIGNATURE_INVALID', 'Chữ ký không hợp lệ');
    }
  }

  // Offerwall/video → Gold (S2S postback). Chargeback → Gold âm + flag account.
  async handleOfferwallPostback(dto: OfferwallPostbackDto) {
    const secret = this.config.get<string>('OFFERWALL_POSTBACK_SECRET') ?? '';
    this.verify(secret, `${dto.userId}:${dto.transactionId}:${dto.goldAmount}`, dto.signature);

    return this.db.transaction(async (tx) => {
      await lockUser(tx, dto.userId);
      const begin = await this.idempotency.begin(
        tx,
        `offerwall:${dto.transactionId}`,
        'offerwall',
        dto.userId,
        WEBHOOK_TTL_SECONDS,
      );
      if (begin.replay) return begin.response;

      let result: Record<string, unknown>;
      if (dto.type === 'CHARGEBACK') {
        await this.ledger.debit(tx, {
          userId: dto.userId,
          currency: 'GOLD',
          amount: dto.goldAmount,
          source: 'OFFERWALL_CHARGEBACK',
          refType: 'offerwall',
          refId: dto.transactionId,
        });
        const bal = await this.ledger.getBalances(tx, dto.userId);
        if (bal.gold < 0) {
          await tx.update(users).set({ isFlagged: true }).where(eq(users.id, dto.userId));
        }
        result = { chargeback: true, goldBalance: bal.gold, flagged: bal.gold < 0 };
      } else {
        await this.ledger.credit(tx, {
          userId: dto.userId,
          currency: 'GOLD',
          amount: dto.goldAmount,
          source: 'OFFERWALL',
          realValueVnd: dto.goldAmount, // 1 Gold = 1đ
          refType: 'offerwall',
          refId: dto.transactionId,
        });
        const bonus = await this.events.creditBestBonus(
          tx,
          dto.userId,
          'EARN_MULTIPLIER',
          'GOLD',
          dto.goldAmount,
          'offerwall',
          dto.transactionId,
        );
        result = { credited: dto.goldAmount, bonus };
      }
      await this.idempotency.complete(tx, `offerwall:${dto.transactionId}`, result);
      return result;
    });
  }

  // IAP → Diamond. transaction_id của provider làm idempotency key (chống replay).
  // Prod: thêm server-side receipt validation (App Store Server Notifications v2 / Google Play RTDN).
  async handleIapWebhook(dto: IapWebhookDto) {
    const secret = this.config.get<string>('IAP_WEBHOOK_SECRET') ?? '';
    this.verify(secret, `${dto.userId}:${dto.transactionId}:${dto.diamondAmount}`, dto.signature);

    return this.db.transaction(async (tx) => {
      await lockUser(tx, dto.userId);
      const begin = await this.idempotency.begin(
        tx,
        `iap:${dto.transactionId}`,
        'iap',
        dto.userId,
        WEBHOOK_TTL_SECONDS,
      );
      if (begin.replay) return begin.response;

      await this.ledger.credit(tx, {
        userId: dto.userId,
        currency: 'DIAMOND',
        amount: dto.diamondAmount,
        source: 'IAP_DIAMOND',
        realValueVnd: dto.diamondAmount * DIAMOND_TO_GOLD, // 1 Diamond = 1.000đ
        refType: 'iap',
        refId: dto.transactionId,
      });
      const bonus = await this.events.creditBestBonus(
        tx,
        dto.userId,
        'TOPUP_MULTIPLIER',
        'DIAMOND',
        dto.diamondAmount,
        'iap',
        dto.transactionId,
      );
      const result = { credited: dto.diamondAmount, bonus };
      await this.idempotency.complete(tx, `iap:${dto.transactionId}`, result);
      return result;
    });
  }
}
