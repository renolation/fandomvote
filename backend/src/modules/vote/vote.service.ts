import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { campaignIdols, campaigns, voteLogs } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { lockUser } from '../../common/utils/wallet-lock.util';
import { vnEndOfDay } from '../../common/utils/time.util';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { AuditService } from '../audit/audit.service';
import { GreenCounterService } from '../wallet/green-counter.service';
import { LedgerService } from '../wallet/ledger.service';
import { CastVoteDto } from './dto/cast-vote.dto';

export interface VoteResult {
  campaignIdolId: string;
  amount: number;
  greenSpent: number;
  goldSpent: number;
  newTotal: number;
  balance: { green: number; gold: number; diamond: number };
}

// Vote ATOMIC — §5. Thứ tự trừ GREEN trước → GOLD sau (FIFO lot).
@Injectable()
export class VoteService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
    private readonly green: GreenCounterService,
    private readonly idempotency: IdempotencyService,
    private readonly audit: AuditService,
  ) {}

  async cast(userId: string, dto: CastVoteDto, idempotencyKey: string): Promise<VoteResult> {
    const n = dto.amount;
    if (!Number.isInteger(n) || n <= 0) {
      throw new BusinessException('VALIDATION_ERROR', 'amount phải là số nguyên dương');
    }

    return this.db.transaction(async (tx) => {
      await lockUser(tx, userId);
      const begin = await this.idempotency.begin<VoteResult>(tx, idempotencyKey, 'vote', userId);
      if (begin.replay) return begin.response;

      // 1. Campaign OPEN? (giờ server, reject nếu quá close_at)
      const ciRows = await tx
        .select()
        .from(campaignIdols)
        .where(eq(campaignIdols.id, dto.campaignIdolId))
        .limit(1);
      if (ciRows.length === 0) throw new BusinessException('NOT_FOUND', 'Idol không có trong campaign');
      const ci = ciRows[0];

      const cRows = await tx.select().from(campaigns).where(eq(campaigns.id, ci.campaignId)).limit(1);
      const campaign = cRows[0];
      if (!campaign) throw new BusinessException('NOT_FOUND', 'Campaign không tồn tại');
      const overdue = campaign.closeAt ? campaign.closeAt.getTime() <= Date.now() : false;
      // Chưa tới open_at (campaign hẹn giờ) → chưa được vote, dù status đã OPEN.
      const notStarted = campaign.openAt ? campaign.openAt.getTime() > Date.now() : false;
      if (campaign.status !== 'OPEN' || overdue || notStarted) {
        throw new BusinessException(
          'CAMPAIGN_NOT_OPEN',
          notStarted ? 'Campaign chưa bắt đầu' : 'Campaign không mở để vote',
        );
      }

      // 2. Balance check SAU lock (Green chưa hết hạn + Gold). Diamond KHÔNG vote trực tiếp.
      const bal = await this.ledger.getBalances(tx, userId);
      if (bal.green + bal.gold < n) {
        throw new BusinessException('INSUFFICIENT_BALANCE', 'Không đủ Green + Gold');
      }

      // 3. Trừ Green trước (FIFO lot) → Gold sau.
      const { greenSpent, goldSpent } = await this.ledger.debitForVote(
        tx,
        userId,
        n,
        'vote',
        ci.id,
      );

      // 4. Cập nhật tổng vote + reached_value_at khi chạm star_goal.
      const prevTotal = ci.totalVotes;
      const newTotal = prevTotal + n;
      const reachedValueAt =
        ci.reachedValueAt === null && newTotal >= campaign.starGoal ? new Date() : ci.reachedValueAt;
      await tx
        .update(campaignIdols)
        .set({ totalVotes: newTotal, reachedValueAt })
        .where(eq(campaignIdols.id, ci.id));

      // 5. vote_logs — tách theo currency, running_total tăng dần (first-to-reach).
      if (greenSpent > 0) {
        await tx.insert(voteLogs).values({
          userId,
          campaignIdolId: ci.id,
          campaignId: ci.campaignId,
          currency: 'GREEN',
          amount: greenSpent,
          realValueVnd: 0,
          runningTotal: prevTotal + greenSpent,
        });
      }
      if (goldSpent > 0) {
        await tx.insert(voteLogs).values({
          userId,
          campaignIdolId: ci.id,
          campaignId: ci.campaignId,
          currency: 'GOLD',
          amount: goldSpent,
          realValueVnd: goldSpent,
          runningTotal: newTotal,
        });
      }

      const balance = await this.ledger.getBalances(tx, userId);
      const result: VoteResult = {
        campaignIdolId: ci.id,
        amount: n,
        greenSpent,
        goldSpent,
        newTotal,
        balance,
      };
      await this.idempotency.complete(tx, idempotencyKey, result);
      return result;
    });
  }

  // Hoạt động vote của tôi — cursor theo vote_logs.id.
  async getMyActivity(userId: string, limit: number, cursor?: string) {
    const cursorId = cursor ? Number(cursor) : undefined;
    const rows = await this.db
      .select()
      .from(voteLogs)
      .where(
        cursorId
          ? and(eq(voteLogs.userId, userId), sql`${voteLogs.id} < ${cursorId}`)
          : eq(voteLogs.userId, userId),
      )
      .orderBy(sql`${voteLogs.id} DESC`)
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasMore ? String(items[items.length - 1].id) : null };
  }

  // Hủy campaign / gỡ idol → hoàn vote. Gold→Gold; Green→Green mới (end-of-day, miễn trần). Chặn nếu RESOLVED — §5.
  async reverseCampaignVotes(adminId: string, campaignId: string): Promise<{ refundedUsers: number }> {
    const cRows = await this.db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (cRows.length === 0) throw new BusinessException('NOT_FOUND', 'Campaign không tồn tại');
    if (cRows[0].status === 'RESOLVED') {
      throw new BusinessException('INVALID_STATE', 'Campaign đã RESOLVED — không thể hoàn');
    }

    const agg = await this.db.execute(sql`
      SELECT user_id,
        COALESCE(SUM(amount) FILTER (WHERE currency = 'GREEN'), 0) AS green,
        COALESCE(SUM(amount) FILTER (WHERE currency = 'GOLD'), 0) AS gold
      FROM vote_logs WHERE campaign_id = ${campaignId} AND is_reversal = false
      GROUP BY user_id
    `);
    const rows = agg.rows as Array<{ user_id: string; green: string; gold: string }>;

    await this.db.transaction(async (tx) => {
      for (const r of rows) {
        const greenSpent = Number(r.green);
        const goldSpent = Number(r.gold);
        await lockUser(tx, r.user_id);
        if (goldSpent > 0) {
          await this.ledger.credit(tx, {
            userId: r.user_id,
            currency: 'GOLD',
            amount: goldSpent,
            source: 'VOTE_REVERSAL',
            refType: 'campaign',
            refId: campaignId,
          });
        }
        if (greenSpent > 0) {
          await this.green.addExemptGreen(
            tx,
            r.user_id,
            greenSpent,
            'VOTE_REVERSAL',
            vnEndOfDay(),
            'campaign',
            campaignId,
          );
        }
      }
      // Zero leaderboard + archive (ledger giữ money trail).
      await tx
        .update(campaignIdols)
        .set({ totalVotes: 0, reachedValueAt: null })
        .where(eq(campaignIdols.campaignId, campaignId));
      await tx
        .update(campaigns)
        .set({ status: 'ARCHIVED', updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId));
      await this.audit.log(tx, adminId, 'campaign.reverse_votes', 'campaign', campaignId, {
        refundedUsers: rows.length,
      });
    });

    return { refundedUsers: rows.length };
  }
}
