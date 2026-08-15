import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { asc, desc, eq } from 'drizzle-orm';
import {
  GiftWalletItem,
  IapPackage,
  OfferTask,
  ShopDeal,
  giftWalletItems,
  iapPackages,
  offerTasks,
  shopDeals,
} from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { addDays } from '../../common/utils/time.util';
import { lockUser } from '../../common/utils/wallet-lock.util';
import { AuditService } from '../audit/audit.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { LedgerService } from '../wallet/ledger.service';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';
import { LiveOffer, LootablyService } from './lootably.service';

export interface RedeemResult {
  giftItem: GiftWalletItem;
  balance: { green: number; gold: number; diamond: number };
}

@Injectable()
export class ShopService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
    private readonly idempotency: IdempotencyService,
    private readonly lootably: LootablyService,
    private readonly audit: AuditService,
  ) {}

  async listDeals(): Promise<ShopDeal[]> {
    return this.db.select().from(shopDeals).where(eq(shopDeals.isActive, true));
  }

  // ===== Admin CRUD deal =====

  // Admin thấy CẢ deal đã tắt (isActive=false) để bật lại/sửa.
  async listAllDeals(): Promise<ShopDeal[]> {
    return this.db.select().from(shopDeals).orderBy(desc(shopDeals.createdAt));
  }

  async createDeal(adminId: string, dto: CreateDealDto): Promise<ShopDeal> {
    const rows = await this.db
      .insert(shopDeals)
      .values({
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        partnerId: dto.partnerId,
        cost: dto.cost,
        currency: dto.currency,
        itemType: dto.itemType,
        stock: dto.stock,
        validityDays: dto.validityDays,
        isActive: dto.isActive ?? true,
      })
      .returning();
    await this.audit.record(adminId, 'deal.create', 'deal', rows[0].id, { title: dto.title });
    return rows[0];
  }

  // Chỉ cập nhật field được gửi. stock_sold không nằm trong DTO → không thể ghi đè số đã đổi.
  async updateDeal(adminId: string, id: string, dto: UpdateDealDto): Promise<ShopDeal> {
    const patch: Partial<typeof shopDeals.$inferInsert> = { updatedAt: new Date() };
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl;
    if (dto.partnerId !== undefined) patch.partnerId = dto.partnerId;
    if (dto.cost !== undefined) patch.cost = dto.cost;
    if (dto.currency !== undefined) patch.currency = dto.currency;
    if (dto.itemType !== undefined) patch.itemType = dto.itemType;
    if (dto.stock !== undefined) patch.stock = dto.stock;
    if (dto.validityDays !== undefined) patch.validityDays = dto.validityDays;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;

    const rows = await this.db.update(shopDeals).set(patch).where(eq(shopDeals.id, id)).returning();
    if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Deal không tồn tại');
    await this.audit.record(adminId, 'deal.update', 'deal', id);
    return rows[0];
  }

  // Danh mục offer wall tĩnh (đang active). Gold cộng qua webhook offerwall postback, không tại đây.
  async listOffers(): Promise<OfferTask[]> {
    return this.db
      .select()
      .from(offerTasks)
      .where(eq(offerTasks.isActive, true))
      .orderBy(asc(offerTasks.sortOrder));
  }

  // Offer wall LIVE cho user hiện tại (Lootably). Chưa cấu hình / rỗng → fallback danh mục tĩnh.
  async listLiveOffers(userId: string, ip: string, userAgent: string): Promise<LiveOffer[]> {
    const live = await this.lootably.fetchOffers(userId, ip, userAgent);
    if (live.length) return live;
    const tasks = await this.listOffers();
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      imageUrl: null,
      actionUrl: t.actionUrl ?? '',
      rewardGold: t.rewardGold,
      icon: t.icon,
      iconBg: t.iconBg,
    }));
  }

  // Gói nạp Diamond (đang active). Diamond chỉ cộng sau webhook IAP + receipt verify.
  async listIapPackages(): Promise<IapPackage[]> {
    return this.db
      .select()
      .from(iapPackages)
      .where(eq(iapPackages.isActive, true))
      .orderBy(asc(iapPackages.priceVnd));
  }

  // Redeem ATOMIC: lock row → stock_sold<stock → trừ điểm → stock_sold++ → tạo gift item — §8.
  async redeemDeal(userId: string, dealId: string, idempotencyKey: string): Promise<RedeemResult> {
    return this.db.transaction(async (tx) => {
      await lockUser(tx, userId);
      const begin = await this.idempotency.begin<RedeemResult>(tx, idempotencyKey, 'redeem', userId);
      if (begin.replay) return begin.response;

      const deals = await tx.select().from(shopDeals).where(eq(shopDeals.id, dealId)).for('update');
      if (deals.length === 0) throw new BusinessException('NOT_FOUND', 'Deal không tồn tại');
      const deal = deals[0];
      if (!deal.isActive) throw new BusinessException('DEAL_INACTIVE', 'Deal đã ngừng');
      if (deal.stockSold >= deal.stock) throw new BusinessException('OUT_OF_STOCK', 'Hết hàng');
      if (deal.currency !== 'GOLD' && deal.currency !== 'DIAMOND') {
        throw new BusinessException('INVALID_STATE', 'Deal phải dùng GOLD hoặc DIAMOND');
      }

      const bal = await this.ledger.getBalances(tx, userId);
      const have = deal.currency === 'GOLD' ? bal.gold : bal.diamond;
      if (have < deal.cost) throw new BusinessException('INSUFFICIENT_BALANCE', 'Không đủ điểm');

      await this.ledger.debit(tx, {
        userId,
        currency: deal.currency,
        amount: deal.cost,
        source: 'PURCHASE',
        refType: 'deal',
        refId: dealId,
      });
      await tx
        .update(shopDeals)
        .set({ stockSold: deal.stockSold + 1 })
        .where(eq(shopDeals.id, dealId)); // invariant stock_sold <= stock giữ nhờ check + lock

      const expiresAt = deal.validityDays ? addDays(deal.validityDays) : null;
      const isDigital = deal.itemType === 'DIGITAL';
      const giftRows = await tx
        .insert(giftWalletItems)
        .values({
          userId,
          dealId,
          itemType: deal.itemType,
          status: isDigital ? 'ACTIVE' : 'PENDING',
          code: isDigital ? randomBytes(8).toString('hex').toUpperCase() : null,
          expiresAt,
        })
        .returning();

      const result: RedeemResult = {
        giftItem: giftRows[0],
        balance: await this.ledger.getBalances(tx, userId),
      };
      await this.idempotency.complete(tx, idempotencyKey, result);
      return result;
    });
  }
}
