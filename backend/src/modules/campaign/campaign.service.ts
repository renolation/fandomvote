import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, lte } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import {
  Campaign,
  campaignIdols,
  campaignSnapshots,
  campaigns,
  donationReceipts,
  idols,
} from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AuditService } from '../audit/audit.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

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

  async list(status?: Campaign['status']): Promise<Campaign[]> {
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
  async getLeaderboard(campaignId: string) {
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

  // Kết quả sau RESOLVED: snapshot xếp hạng + biên lai quỹ (nếu có).
  async getResult(campaignId: string) {
    const campaign = await this.getById(campaignId);
    const snapshot = await this.db
      .select()
      .from(campaignSnapshots)
      .where(eq(campaignSnapshots.campaignId, campaignId))
      .orderBy(asc(campaignSnapshots.rank));
    const receipt = await this.db
      .select()
      .from(donationReceipts)
      .where(eq(donationReceipts.campaignId, campaignId))
      .limit(1);
    return { campaign, snapshot, receipt: receipt[0] ?? null };
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
