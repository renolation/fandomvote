import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, lt } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { GiftWalletItem, giftWalletItems, shippingAddresses } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { CreateAddressDto } from './dto/shop.dto';

// Lazy expiration — §8. DIGITAL ACTIVE→USED→EXPIRED. PHYSICAL PENDING→CONFIRMED→...→DELIVERED/EXPIRED.
@Injectable()
export class GiftWalletService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private async lazyExpire(userId: string): Promise<void> {
    await this.db
      .update(giftWalletItems)
      .set({ status: 'EXPIRED' })
      .where(
        and(
          eq(giftWalletItems.userId, userId),
          lt(giftWalletItems.expiresAt, new Date()),
          inArray(giftWalletItems.status, ['ACTIVE', 'PENDING']),
        ),
      );
  }

  async list(userId: string): Promise<GiftWalletItem[]> {
    await this.lazyExpire(userId);
    return this.db.select().from(giftWalletItems).where(eq(giftWalletItems.userId, userId));
  }

  async useDigital(userId: string, id: string): Promise<GiftWalletItem> {
    await this.lazyExpire(userId);
    const rows = await this.db
      .update(giftWalletItems)
      .set({ status: 'USED', usedAt: new Date() })
      .where(
        and(
          eq(giftWalletItems.id, id),
          eq(giftWalletItems.userId, userId),
          eq(giftWalletItems.status, 'ACTIVE'),
        ),
      )
      .returning();
    if (rows.length === 0) throw new BusinessException('INVALID_STATE', 'Quà không dùng được');
    return rows[0];
  }

  async confirmPhysical(userId: string, id: string, shippingAddressId: string): Promise<GiftWalletItem> {
    const addr = await this.db
      .select({ id: shippingAddresses.id })
      .from(shippingAddresses)
      .where(and(eq(shippingAddresses.id, shippingAddressId), eq(shippingAddresses.userId, userId)))
      .limit(1);
    if (addr.length === 0) throw new BusinessException('NOT_FOUND', 'Địa chỉ không tồn tại');

    const rows = await this.db
      .update(giftWalletItems)
      .set({ status: 'CONFIRMED', confirmedAt: new Date(), shippingAddressId })
      .where(
        and(
          eq(giftWalletItems.id, id),
          eq(giftWalletItems.userId, userId),
          eq(giftWalletItems.status, 'PENDING'),
        ),
      )
      .returning();
    if (rows.length === 0) throw new BusinessException('INVALID_STATE', 'Quà không xác nhận được');
    return rows[0];
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const rows = await this.db
      .insert(shippingAddresses)
      .values({ ...dto, userId })
      .returning();
    return rows[0];
  }

  async listAddresses(userId: string) {
    return this.db.select().from(shippingAddresses).where(eq(shippingAddresses.userId, userId));
  }
}
