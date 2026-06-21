import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { campaignSnapshots, campaigns, donationReceipts } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { fundFromGold } from '../../common/utils/money.util';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';

export interface ResolutionResult {
  outcome: 'A' | 'B'; // A: top đạt goal (Vote LED). B: trượt → quỹ + biên lai per-user.
  topIdolId: string | null;
  topVotes: number;
  goldTotal: number;
  fundVnd: number | null;
  receiptsCount: number;
}

// Resolution idempotent qua CAS CLOSED→RESOLVING. Chỉ đọc snapshot đông cứng — §6.
@Injectable()
export class ResolutionService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly audit: AuditService,
    private readonly notification: NotificationService,
  ) {}

  async resolve(adminId: string, campaignId: string): Promise<ResolutionResult> {
    return this.db.transaction(async (tx) => {
      // CAS: chỉ 1 worker thắng, chống double-run.
      const cas = await tx
        .update(campaigns)
        .set({ status: 'RESOLVING', updatedAt: new Date() })
        .where(and(eq(campaigns.id, campaignId), eq(campaigns.status, 'CLOSED')))
        .returning();
      if (cas.length === 0) {
        throw new BusinessException('INVALID_STATE', 'Campaign phải CLOSED và chưa resolve');
      }
      const campaign = cas[0];
      if (!campaign.snapshottedAt) {
        throw new BusinessException('INVALID_STATE', 'Campaign chưa snapshot');
      }

      const snap = await tx
        .select()
        .from(campaignSnapshots)
        .where(eq(campaignSnapshots.campaignId, campaignId))
        .orderBy(asc(campaignSnapshots.rank));
      const top = snap[0] ?? null;
      const topVotes = top ? top.totalVotes : 0;
      const reachedGoal = top ? top.totalVotes >= campaign.starGoal : false;

      // Σ GOLD đã vote mọi idol (không tính reversal). Green KHÔNG vào quỹ.
      const goldRes = await tx.execute(sql`
        SELECT COALESCE(SUM(amount), 0) AS s FROM vote_logs
        WHERE campaign_id = ${campaignId} AND currency = 'GOLD' AND is_reversal = false
      `);
      const goldTotal = Number((goldRes.rows[0] as { s: string }).s);

      let fundVnd: number | null = null;
      let receiptsCount = 0;
      if (!reachedGoal) {
        // Biên lai PER-USER: mỗi voter Gold 1 dòng. Quỹ = Σ donatedVnd (sum-of-floor, khớp invariant 5).
        const perUser = await tx.execute(sql`
          SELECT user_id, COALESCE(SUM(amount), 0) AS gold FROM vote_logs
          WHERE campaign_id = ${campaignId} AND currency = 'GOLD' AND is_reversal = false
          GROUP BY user_id HAVING COALESCE(SUM(amount), 0) > 0
        `);
        const stamp = campaign.closedAt?.getTime() ?? campaign.createdAt.getTime();
        let fund = 0;
        for (const row of perUser.rows as Array<{ user_id: string; gold: string }>) {
          const goldVoted = Number(row.gold);
          const donatedVnd = fundFromGold(goldVoted, campaign.donationRatioBps);
          fund += donatedVnd;
          await tx.insert(donationReceipts).values({
            campaignId,
            userId: row.user_id,
            goldVoted,
            donatedVnd,
            donationRatioBps: campaign.donationRatioBps,
            receiptNo: `HEART-${campaignId.slice(0, 8)}-${row.user_id.slice(0, 8)}-${stamp}`,
          });
          receiptsCount++;
        }
        fundVnd = fund;
      }

      // Thông báo kết quả cho mọi voter (A: chúc mừng / B: an ủi — §6 luật C).
      const voters = await tx.execute(sql`
        SELECT DISTINCT user_id FROM vote_logs WHERE campaign_id = ${campaignId}
      `);
      const title = reachedGoal ? 'Chiến dịch đạt mục tiêu!' : 'Kết quả chiến dịch';
      const body = reachedGoal
        ? `Idol dẫn đầu đã đạt mốc ${campaign.starGoal} sao — Vote LED sẽ được kích hoạt.`
        : 'Chiến dịch đã kết thúc. Cảm ơn bạn đã đồng hành — quỹ quyên góp đã được ghi nhận.';
      await this.notification.createMany(
        tx,
        (voters.rows as Array<{ user_id: string }>).map((r) => ({
          userId: r.user_id,
          type: 'RESOLUTION' as const,
          title,
          body,
          data: { campaignId, outcome: reachedGoal ? 'A' : 'B' },
        })),
      );

      await tx
        .update(campaigns)
        .set({ status: 'RESOLVED', resolvedAt: new Date(), updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId));
      await this.audit.log(tx, adminId, 'campaign.resolve', 'campaign', campaignId, {
        outcome: reachedGoal ? 'A' : 'B',
        goldTotal,
        fundVnd,
      });

      return {
        outcome: reachedGoal ? 'A' : 'B',
        topIdolId: top?.idolId ?? null,
        topVotes,
        goldTotal,
        fundVnd,
        receiptsCount,
      };
    });
  }
}
