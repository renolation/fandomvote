import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, lt } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import {
  GiftWalletItem,
  giftWalletItems,
  shippingAddresses,
  shopDeals,
  users,
} from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AuditService } from '../audit/audit.service';
import { CreateAddressDto } from './dto/shop.dto';

// Đơn hàng admin trả về cho FE (gift item PHYSICAL + user + deal + địa chỉ).
export interface AdminOrder {
  id: string;
  status: GiftWalletItem['status'];
  dealTitle: string | null;
  code: string | null;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  user: { id: string; displayName: string; email: string | null };
  address: {
    recipient: string;
    phone: string;
    line1: string;
    line2: string | null;
    ward: string | null;
    district: string | null;
    province: string;
    note: string | null;
  } | null;
}

// Lazy expiration — §8. DIGITAL ACTIVE→USED→EXPIRED. PHYSICAL PENDING→CONFIRMED→...→DELIVERED/EXPIRED.
@Injectable()
export class GiftWalletService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly audit: AuditService,
  ) {}

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

  // ===== Admin xử lý đơn quà PHYSICAL =====

  // Join 1 dòng gift item PHYSICAL → user + deal + địa chỉ. Dùng cho list & mapper sau update.
  private orderSelect(executor: DbOrTx = this.db) {
    return executor
      .select({
        id: giftWalletItems.id,
        status: giftWalletItems.status,
        code: giftWalletItems.code,
        createdAt: giftWalletItems.createdAt,
        confirmedAt: giftWalletItems.confirmedAt,
        shippedAt: giftWalletItems.shippedAt,
        deliveredAt: giftWalletItems.deliveredAt,
        shippingAddressId: giftWalletItems.shippingAddressId,
        dealTitle: shopDeals.title,
        userId: users.id,
        userName: users.displayName,
        userEmail: users.email,
        addrRecipient: shippingAddresses.recipient,
        addrPhone: shippingAddresses.phone,
        addrLine1: shippingAddresses.line1,
        addrLine2: shippingAddresses.line2,
        addrWard: shippingAddresses.ward,
        addrDistrict: shippingAddresses.district,
        addrProvince: shippingAddresses.province,
        addrNote: shippingAddresses.note,
      })
      .from(giftWalletItems)
      .leftJoin(users, eq(users.id, giftWalletItems.userId))
      .leftJoin(shopDeals, eq(shopDeals.id, giftWalletItems.dealId))
      .leftJoin(shippingAddresses, eq(shippingAddresses.id, giftWalletItems.shippingAddressId));
  }

  // Map dòng joined → AdminOrder. address=null khi item chưa gắn địa chỉ.
  private toAdminOrder(r: Awaited<ReturnType<GiftWalletService['orderSelect']>>[number]): AdminOrder {
    return {
      id: r.id,
      status: r.status,
      dealTitle: r.dealTitle ?? null,
      code: r.code,
      createdAt: r.createdAt.toISOString(),
      confirmedAt: r.confirmedAt?.toISOString() ?? null,
      shippedAt: r.shippedAt?.toISOString() ?? null,
      deliveredAt: r.deliveredAt?.toISOString() ?? null,
      user: {
        id: r.userId ?? '',
        displayName: r.userName ?? '',
        email: r.userEmail ?? null,
      },
      address: r.shippingAddressId
        ? {
            recipient: r.addrRecipient ?? '',
            phone: r.addrPhone ?? '',
            line1: r.addrLine1 ?? '',
            line2: r.addrLine2 ?? null,
            ward: r.addrWard ?? null,
            district: r.addrDistrict ?? null,
            province: r.addrProvince ?? '',
            note: r.addrNote ?? null,
          }
        : null,
    };
  }

  // Liệt kê đơn PHYSICAL theo trạng thái (ALL/undefined = tất cả), mới nhất trước.
  async listOrders(status?: string): Promise<AdminOrder[]> {
    const conds = [eq(giftWalletItems.itemType, 'PHYSICAL')];
    if (status && status !== 'ALL') {
      conds.push(eq(giftWalletItems.status, status as GiftWalletItem['status']));
    }
    const rows = await this.orderSelect()
      .where(and(...conds))
      .orderBy(desc(giftWalletItems.createdAt));
    return rows.map((r) => this.toAdminOrder(r));
  }

  // Re-query đơn theo id (sau khi update) để build AdminOrder đầy đủ join.
  private async getOrderById(executor: DbOrTx, id: string): Promise<AdminOrder> {
    const rows = await this.orderSelect(executor).where(eq(giftWalletItems.id, id)).limit(1);
    if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Đơn không tồn tại');
    return this.toAdminOrder(rows[0]);
  }

  // CONFIRMED → SHIPPED, set shipped_at. Ghi audit cùng transaction.
  async markShipped(adminId: string, id: string): Promise<AdminOrder> {
    return this.db.transaction(async (tx: DbOrTx) => {
      const rows = await tx
        .update(giftWalletItems)
        .set({ status: 'SHIPPED', shippedAt: new Date() })
        .where(and(eq(giftWalletItems.id, id), eq(giftWalletItems.status, 'CONFIRMED')))
        .returning();
      if (rows.length === 0) throw new BusinessException('INVALID_STATE', 'Đơn chưa ở trạng thái CONFIRMED');
      await this.audit.log(tx, adminId, 'order.ship', 'gift_wallet_item', id);
      return this.getOrderById(tx, id);
    });
  }

  // SHIPPED → DELIVERED, set delivered_at. Ghi audit cùng transaction.
  async markDelivered(adminId: string, id: string): Promise<AdminOrder> {
    return this.db.transaction(async (tx: DbOrTx) => {
      const rows = await tx
        .update(giftWalletItems)
        .set({ status: 'DELIVERED', deliveredAt: new Date() })
        .where(and(eq(giftWalletItems.id, id), eq(giftWalletItems.status, 'SHIPPED')))
        .returning();
      if (rows.length === 0) throw new BusinessException('INVALID_STATE', 'Đơn chưa ở trạng thái SHIPPED');
      await this.audit.log(tx, adminId, 'order.deliver', 'gift_wallet_item', id);
      return this.getOrderById(tx, id);
    });
  }
}
