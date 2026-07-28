import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import {
  Campaign,
  campaignIdols,
  campaignSnapshots,
  campaigns,
  donationReceipts,
  idols,
  voteLogs,
} from '../../db/schema';
import { type LeaderboardPeriod, periodRange } from '../../common/utils/time.util';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AuditService } from '../audit/audit.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly audit: AuditService,
  ) {}

  async create(adminId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const rows = await this.db
      .insert(campaigns)
      .values({
        title: dto.title,
        description: dto.description,
        rulesContent: dto.rulesContent,
        prize: dto.prize,
        starGoal: dto.starGoal,
        donationRatioBps: dto.donationRatioBps ?? 5000,
        openAt: dto.openAt ? new Date(dto.openAt) : null,
        closeAt: dto.closeAt ? new Date(dto.closeAt) : null,
        createdBy: adminId,
      })
      .returning();
    await this.audit.record(adminId, 'campaign.create', 'campaign', rows[0].id);
    return rows[0];
  }

  // Sửa campaign (DEV): cập nhật field defined cho MỌI trạng thái (kể cả RESOLVED) — không guard.
  async update(adminId: string, id: string, dto: UpdateCampaignDto): Promise<Campaign> {
    const patch: Partial<typeof campaigns.$inferInsert> = { updatedAt: new Date() };
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.rulesContent !== undefined) patch.rulesContent = dto.rulesContent;
    if (dto.prize !== undefined) patch.prize = dto.prize;
    if (dto.starGoal !== undefined) patch.starGoal = dto.starGoal;
    if (dto.donationRatioBps !== undefined) patch.donationRatioBps = dto.donationRatioBps;
    if (dto.openAt !== undefined) patch.openAt = dto.openAt ? new Date(dto.openAt) : null;
    if (dto.closeAt !== undefined) patch.closeAt = dto.closeAt ? new Date(dto.closeAt) : null;
    const rows = await this.db.update(campaigns).set(patch).where(eq(campaigns.id, id)).returning();
    if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Campaign không tồn tại');
    await this.audit.record(adminId, 'campaign.update', 'campaign', id);
    return rows[0];
  }

  // DRAFT → OPEN. star_goal chốt ở DRAFT, không sửa sau OPEN — §6.
  async open(adminId: string, id: string): Promise<Campaign> {
    const rows = await this.db
      .update(campaigns)
      .set({ status: 'OPEN', openAt: new Date(), updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.status, 'DRAFT')))
      .returning();
    if (rows.length === 0) {
      throw new BusinessException('INVALID_STATE', 'Campaign không ở trạng thái DRAFT');
    }
    await this.audit.record(adminId, 'campaign.open', 'campaign', id);
    return rows[0];
  }

  // status=OPEN nghĩa là "đang mở để vote": loại campaign hẹn giờ chưa tới open_at
  // (admin sửa open_at về tương lai cho campaign đã OPEN) → trang vote không hiện, chỉ nằm ở "Sắp tới".
  // Bỏ trống status = mọi campaign (trang Sự kiện tự chia nhóm theo open_at/close_at).
  async list(status?: Campaign['status']): Promise<Campaign[]> {
    if (status === 'OPEN') {
      return this.db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.status, 'OPEN'),
            or(isNull(campaigns.openAt), lte(campaigns.openAt, new Date())),
          ),
        )
        .orderBy(desc(campaigns.createdAt));
    }
    if (status) {
      return this.db.select().from(campaigns).where(eq(campaigns.status, status)).orderBy(desc(campaigns.createdAt));
    }
    return this.db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getById(id: string): Promise<Campaign> {
    const rows = await this.db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Campaign không tồn tại');
    return rows[0];
  }

  // Leaderboard: tie-break reached_value_at sớm hơn (first-to-reach), rồi id — §6.
  // period (DAY/WEEK/MONTH, UTC+7) → tính totalVotes từ vote_logs trong kỳ; bỏ trống = all-time.
  async getLeaderboard(campaignId: string, period?: LeaderboardPeriod) {
    if (!period) {
      return this.db
        .select({
          campaignIdolId: campaignIdols.id,
          idolId: idols.id,
          name: idols.name,
          avatarUrl: idols.avatarUrl,
          totalVotes: campaignIdols.totalVotes,
          reachedValueAt: campaignIdols.reachedValueAt,
        })
        .from(campaignIdols)
        .innerJoin(idols, eq(campaignIdols.idolId, idols.id))
        .where(eq(campaignIdols.campaignId, campaignId))
        .orderBy(desc(campaignIdols.totalVotes), asc(campaignIdols.reachedValueAt), asc(campaignIdols.id));
    }
    const { start, end } = periodRange(period);
    const periodVotes = sql<number>`COALESCE(SUM(${voteLogs.amount}), 0)`;
    return this.db
      .select({
        campaignIdolId: campaignIdols.id,
        idolId: idols.id,
        name: idols.name,
        avatarUrl: idols.avatarUrl,
        totalVotes: periodVotes.mapWith(Number),
        reachedValueAt: campaignIdols.reachedValueAt,
      })
      .from(campaignIdols)
      .innerJoin(idols, eq(campaignIdols.idolId, idols.id))
      .leftJoin(
        voteLogs,
        and(
          eq(voteLogs.campaignIdolId, campaignIdols.id),
          eq(voteLogs.isReversal, false),
          gte(voteLogs.createdAt, start),
          lt(voteLogs.createdAt, end),
        ),
      )
      .where(eq(campaignIdols.campaignId, campaignId))
      .groupBy(campaignIdols.id, idols.id, idols.name, idols.avatarUrl, campaignIdols.reachedValueAt)
      .orderBy(desc(periodVotes), asc(campaignIdols.id));
  }

  // User đưa idol đã duyệt vào campaign OPEN — §7.
  async addIdolToCampaign(userId: string, campaignId: string, idolId: string) {
    const idol = await this.db.select().from(idols).where(eq(idols.id, idolId)).limit(1);
    if (idol.length === 0 || idol[0].status !== 'APPROVED') {
      throw new BusinessException('INVALID_STATE', 'Idol chưa được duyệt');
    }
    const camp = await this.getById(campaignId);
    if (camp.status !== 'OPEN') throw new BusinessException('CAMPAIGN_NOT_OPEN', 'Campaign chưa mở');
    try {
      const rows = await this.db
        .insert(campaignIdols)
        .values({ campaignId, idolId, addedBy: userId })
        .returning();
      return rows[0];
    } catch (e) {
      if ((e as { code?: string })?.code === '23505') {
        const existing = await this.db
          .select()
          .from(campaignIdols)
          .where(and(eq(campaignIdols.campaignId, campaignId), eq(campaignIdols.idolId, idolId)))
          .limit(1);
        return existing[0];
      }
      throw e;
    }
  }

  // Kết quả sau RESOLVED: snapshot xếp hạng + tổng quỹ (biên lai per-user → tổng).
  async getResult(campaignId: string) {
    const campaign = await this.getById(campaignId);
    const snapshot = await this.db
      .select()
      .from(campaignSnapshots)
      .where(eq(campaignSnapshots.campaignId, campaignId))
      .orderBy(asc(campaignSnapshots.rank));
    const agg = await this.db.execute(sql`
      SELECT COALESCE(SUM(donated_vnd), 0) AS fund, COUNT(*) AS receipts
      FROM donation_receipts WHERE campaign_id = ${campaignId}
    `);
    const row = agg.rows[0] as { fund: string; receipts: string };
    return {
      campaign,
      snapshot,
      fundVnd: Number(row.fund),
      receiptsCount: Number(row.receipts),
    };
  }

  // Biên lai từng user (immutable). Trả null nếu user không vote Gold campaign này.
  async getMyReceipt(campaignId: string, userId: string) {
    const rows = await this.db
      .select()
      .from(donationReceipts)
      .where(and(eq(donationReceipts.campaignId, campaignId), eq(donationReceipts.userId, userId)))
      .limit(1);
    return rows[0] ?? null;
  }

  // Scheduler: DRAFT→OPEN khi tới open_at — cho phép admin hẹn giờ campaign ("Sắp tới" → tự mở).
  // Giữ nguyên open_at đã hẹn (không ghi đè bằng giờ chạy cron) để mốc bắt đầu đúng như admin đặt.
  // open_at NULL → không tự mở (phải bấm "Mở campaign" thủ công).
  async openDueCampaigns(): Promise<number> {
    const rows = await this.db
      .update(campaigns)
      .set({ status: 'OPEN', updatedAt: new Date() })
      .where(and(eq(campaigns.status, 'DRAFT'), lte(campaigns.openAt, new Date())))
      .returning({ id: campaigns.id });
    return rows.length;
  }

  // Scheduler: OPEN→CLOSED khi quá close_at + snapshot idempotent — §6/§16.
  async closeDueCampaigns(): Promise<number> {
    const due = await this.db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(eq(campaigns.status, 'OPEN'), lte(campaigns.closeAt, new Date())));
    let closed = 0;
    for (const c of due) {
      if (await this.close(c.id)) closed++;
    }
    return closed;
  }

  async close(campaignId: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const upd = await tx
        .update(campaigns)
        .set({ status: 'CLOSED', closedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(campaigns.id, campaignId), eq(campaigns.status, 'OPEN')))
        .returning({ id: campaigns.id });
      if (upd.length === 0) return false; // không OPEN / đã đóng
      await this.takeSnapshot(tx, campaignId);
      return true;
    });
  }

  // Đông cứng leaderboard. Guard snapshotted_at null → idempotent.
  private async takeSnapshot(tx: DbOrTx, campaignId: string): Promise<void> {
    const c = await tx.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (c.length === 0 || c[0].snapshottedAt) return;
    const cis = await tx
      .select()
      .from(campaignIdols)
      .where(eq(campaignIdols.campaignId, campaignId))
      .orderBy(desc(campaignIdols.totalVotes), asc(campaignIdols.reachedValueAt), asc(campaignIdols.id));
    let rank = 1;
    for (const ci of cis) {
      await tx.insert(campaignSnapshots).values({
        campaignId,
        campaignIdolId: ci.id,
        idolId: ci.idolId,
        rank,
        totalVotes: ci.totalVotes,
        reachedValueAt: ci.reachedValueAt,
      });
      rank++;
    }
    await tx.update(campaigns).set({ snapshottedAt: new Date() }).where(eq(campaigns.id, campaignId));
  }
}
