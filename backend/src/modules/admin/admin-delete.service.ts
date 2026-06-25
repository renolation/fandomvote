import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray, or } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AuditService } from '../audit/audit.service';
import {
  adminAuditLog,
  campaignIdols,
  campaigns,
  campaignSnapshots,
  donationReceipts,
  giftWalletItems,
  greenDailyCounter,
  idolFollows,
  idols,
  iapPackages,
  leaderboardSnapshots,
  notifications,
  offerTasks,
  pointEvents,
  referrals,
  refreshTokens,
  shippingAddresses,
  shopDeals,
  userMetrics,
  users,
  verificationTokens,
  voteLogs,
  walletLedger,
} from '../../db/schema';

// Hard-delete có cascade thủ công: xóa mọi bản ghi con theo đúng thứ tự FK trong
// MỘT transaction để ràng buộc khóa ngoại không bao giờ vỡ, kết thúc bằng audit log.
@Injectable()
export class AdminDeleteService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly audit: AuditService,
  ) {}

  // Xóa user + toàn bộ dữ liệu liên quan. Các FK nullable (idol nominated_by,
  // campaign created_by, campaign_idol added_by) set null thay vì xóa entity.
  async deleteUser(adminId: string, id: string): Promise<{ deleted: true }> {
    // Chặn tự xoá: admin xoá chính mình sẽ làm vỡ FK audit (admin_id → users) và rollback.
    if (adminId === id) {
      throw new BusinessException('FORBIDDEN', 'Không thể tự xoá tài khoản đang đăng nhập');
    }
    return this.db.transaction(async (tx) => {
      // Gỡ tham chiếu nullable trước (giữ lại entity, chỉ bỏ liên kết người dùng).
      await tx.update(idols).set({ nominatedBy: null }).where(eq(idols.nominatedBy, id));
      await tx.update(campaigns).set({ createdBy: null }).where(eq(campaigns.createdBy, id));
      await tx.update(campaignIdols).set({ addedBy: null }).where(eq(campaignIdols.addedBy, id));

      // Xóa con trỏ tới user. gift_wallet_items TRƯỚC shipping_addresses (gift → address).
      await tx.delete(giftWalletItems).where(eq(giftWalletItems.userId, id));
      await tx.delete(walletLedger).where(eq(walletLedger.userId, id));
      await tx.delete(voteLogs).where(eq(voteLogs.userId, id));
      await tx.delete(leaderboardSnapshots).where(eq(leaderboardSnapshots.userId, id));
      await tx.delete(donationReceipts).where(eq(donationReceipts.userId, id));
      await tx.delete(idolFollows).where(eq(idolFollows.userId, id));
      await tx.delete(notifications).where(eq(notifications.userId, id));
      await tx.delete(shippingAddresses).where(eq(shippingAddresses.userId, id));
      await tx.delete(refreshTokens).where(eq(refreshTokens.userId, id));
      await tx.delete(verificationTokens).where(eq(verificationTokens.userId, id));
      await tx.delete(greenDailyCounter).where(eq(greenDailyCounter.userId, id));
      await tx.delete(userMetrics).where(eq(userMetrics.userId, id));
      await tx.delete(adminAuditLog).where(eq(adminAuditLog.adminId, id));
      await tx
        .delete(referrals)
        .where(or(eq(referrals.referrerId, id), eq(referrals.refereeId, id)));

      const rows = await tx.delete(users).where(eq(users.id, id)).returning({ id: users.id });
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'User không tồn tại');

      await this.audit.log(tx, adminId, 'admin.delete.user', 'user', id);
      return { deleted: true };
    });
  }

  // Xóa campaign + vote/biên lai/snapshot/campaign_idol thuộc về nó.
  async deleteCampaign(adminId: string, id: string): Promise<{ deleted: true }> {
    return this.db.transaction(async (tx) => {
      await tx.delete(voteLogs).where(eq(voteLogs.campaignId, id));
      await tx.delete(donationReceipts).where(eq(donationReceipts.campaignId, id));
      await tx.delete(campaignSnapshots).where(eq(campaignSnapshots.campaignId, id));
      await tx.delete(campaignIdols).where(eq(campaignIdols.campaignId, id));

      const rows = await tx
        .delete(campaigns)
        .where(eq(campaigns.id, id))
        .returning({ id: campaigns.id });
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Campaign không tồn tại');

      await this.audit.log(tx, adminId, 'admin.delete.campaign', 'campaign', id);
      return { deleted: true };
    });
  }

  // Xóa idol + mọi campaign_idol/vote/snapshot/follow tham chiếu idol này.
  async deleteIdol(adminId: string, id: string): Promise<{ deleted: true }> {
    return this.db.transaction(async (tx) => {
      const ciRows = await tx
        .select({ id: campaignIdols.id })
        .from(campaignIdols)
        .where(eq(campaignIdols.idolId, id));
      const ciIds = ciRows.map((r) => r.id);
      if (ciIds.length) {
        await tx.delete(voteLogs).where(inArray(voteLogs.campaignIdolId, ciIds));
        await tx.delete(campaignSnapshots).where(inArray(campaignSnapshots.campaignIdolId, ciIds));
      }
      await tx.delete(campaignSnapshots).where(eq(campaignSnapshots.idolId, id));
      await tx.delete(campaignIdols).where(eq(campaignIdols.idolId, id));
      await tx.delete(idolFollows).where(eq(idolFollows.idolId, id));

      const rows = await tx.delete(idols).where(eq(idols.id, id)).returning({ id: idols.id });
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Idol không tồn tại');

      await this.audit.log(tx, adminId, 'admin.delete.idol', 'idol', id);
      return { deleted: true };
    });
  }

  // Xóa shop deal + gift item đã đổi từ deal này.
  async deleteDeal(adminId: string, id: string): Promise<{ deleted: true }> {
    return this.db.transaction(async (tx) => {
      await tx.delete(giftWalletItems).where(eq(giftWalletItems.dealId, id));

      const rows = await tx
        .delete(shopDeals)
        .where(eq(shopDeals.id, id))
        .returning({ id: shopDeals.id });
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Deal không tồn tại');

      await this.audit.log(tx, adminId, 'admin.delete.deal', 'deal', id);
      return { deleted: true };
    });
  }

  async deleteOffer(adminId: string, id: string): Promise<{ deleted: true }> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .delete(offerTasks)
        .where(eq(offerTasks.id, id))
        .returning({ id: offerTasks.id });
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Offer không tồn tại');

      await this.audit.log(tx, adminId, 'admin.delete.offer', 'offer', id);
      return { deleted: true };
    });
  }

  async deleteIapPackage(adminId: string, id: string): Promise<{ deleted: true }> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .delete(iapPackages)
        .where(eq(iapPackages.id, id))
        .returning({ id: iapPackages.id });
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Gói IAP không tồn tại');

      await this.audit.log(tx, adminId, 'admin.delete.iap-package', 'iap-package', id);
      return { deleted: true };
    });
  }

  async deletePointEvent(adminId: string, id: string): Promise<{ deleted: true }> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .delete(pointEvents)
        .where(eq(pointEvents.id, id))
        .returning({ id: pointEvents.id });
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Sự kiện điểm không tồn tại');

      await this.audit.log(tx, adminId, 'admin.delete.point-event', 'point-event', id);
      return { deleted: true };
    });
  }

  async deleteGiftItem(adminId: string, id: string): Promise<{ deleted: true }> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .delete(giftWalletItems)
        .where(eq(giftWalletItems.id, id))
        .returning({ id: giftWalletItems.id });
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Quà không tồn tại');

      await this.audit.log(tx, adminId, 'admin.delete.gift', 'gift', id);
      return { deleted: true };
    });
  }

  async deleteNotification(adminId: string, id: string): Promise<{ deleted: true }> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .delete(notifications)
        .where(eq(notifications.id, id))
        .returning({ id: notifications.id });
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Thông báo không tồn tại');

      await this.audit.log(tx, adminId, 'admin.delete.notification', 'notification', id);
      return { deleted: true };
    });
  }

  // id là bigint → controller dùng ParseIntPipe, truyền number vào đây.
  async deleteLeaderboardSnapshot(adminId: string, id: number): Promise<{ deleted: true }> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .delete(leaderboardSnapshots)
        .where(eq(leaderboardSnapshots.id, id))
        .returning({ id: leaderboardSnapshots.id });
      if (rows.length === 0)
        throw new BusinessException('NOT_FOUND', 'Snapshot bảng xếp hạng không tồn tại');

      await this.audit.log(
        tx,
        adminId,
        'admin.delete.leaderboard-snapshot',
        'leaderboard-snapshot',
        String(id),
      );
      return { deleted: true };
    });
  }
}
