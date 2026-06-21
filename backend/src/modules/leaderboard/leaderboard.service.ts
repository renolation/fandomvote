import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ne, type SQL, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { leaderboardSnapshots } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { lockUser } from '../../common/utils/wallet-lock.util';
import { type LeaderboardPeriod, periodRange, previousPeriodRange } from '../../common/utils/time.util';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { LedgerService } from '../wallet/ledger.service';

export type BoardType = 'TOP_VOTER' | 'TOP_EARNER';
export interface BoardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
}

// User leaderboards — §17. Top Voter (Σ vote) / Top Earner (Σ Gold cày VIDEO/OFFERWALL/TASK).
@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly config: PlatformConfigService,
    private readonly notification: NotificationService,
    private readonly ledger: LedgerService,
    private readonly audit: AuditService,
  ) {}

  // SELECT user_id, name, score (chưa ORDER/LIMIT) — dùng lại cho board + rank.
  private aggSql(type: BoardType, start: Date, end: Date): SQL {
    if (type === 'TOP_VOTER') {
      return sql`SELECT v.user_id AS user_id, u.display_name AS name, COALESCE(SUM(v.amount),0) AS score
        FROM vote_logs v JOIN users u ON u.id = v.user_id
        WHERE v.is_reversal = false AND v.created_at >= ${start} AND v.created_at < ${end}
        GROUP BY v.user_id, u.display_name`;
    }
    return sql`SELECT l.user_id AS user_id, u.display_name AS name, COALESCE(SUM(l.amount),0) AS score
      FROM wallet_ledger l JOIN users u ON u.id = l.user_id
      WHERE l.currency = 'GOLD' AND l.amount > 0 AND l.source IN ('VIDEO','OFFERWALL','TASK')
        AND l.created_at >= ${start} AND l.created_at < ${end}
      GROUP BY l.user_id, u.display_name`;
  }

  async getBoard(type: BoardType, period: LeaderboardPeriod, limit = 20): Promise<BoardEntry[]> {
    const { start, end } = periodRange(period);
    const res = await this.db.execute(
      sql`${this.aggSql(type, start, end)} ORDER BY score DESC, user_id ASC LIMIT ${limit}`,
    );
    return (res.rows as Array<{ user_id: string; name: string; score: string }>).map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      name: r.name,
      score: Number(r.score),
    }));
  }

  async getMyRank(userId: string, type: BoardType, period: LeaderboardPeriod) {
    const { start, end } = periodRange(period);
    const agg = this.aggSql(type, start, end);
    const me = await this.db.execute(sql`SELECT score FROM (${agg}) t WHERE t.user_id = ${userId}`);
    const score = me.rows.length ? Number((me.rows[0] as { score: string }).score) : 0;
    if (score <= 0) return { type, period, rank: null as number | null, score: 0 };
    const higher = await this.db.execute(
      sql`SELECT COUNT(*) AS c FROM (${agg}) t WHERE t.score > ${score}`,
    );
    return { type, period, rank: Number((higher.rows[0] as { c: string }).c) + 1, score };
  }

  // Cron cuối kỳ: snapshot top N của kỳ LIỀN TRƯỚC (idempotent).
  async snapshotPreviousPeriod(type: BoardType, period: LeaderboardPeriod): Promise<number> {
    const { start, end } = previousPeriodRange(period);
    const topN = await this.config.get<number>('leaderboard.top_n', 10);
    const res = await this.db.execute(
      sql`${this.aggSql(type, start, end)} ORDER BY score DESC, user_id ASC LIMIT ${topN}`,
    );
    const rows = res.rows as Array<{ user_id: string; score: string }>;
    let n = 0;
    for (let i = 0; i < rows.length; i++) {
      const inserted = await this.db
        .insert(leaderboardSnapshots)
        .values({
          boardType: type,
          period,
          periodStart: start,
          periodEnd: end,
          userId: rows[i].user_id,
          rank: i + 1,
          score: Number(rows[i].score),
          rewardStatus: 'PENDING',
        })
        .onConflictDoNothing()
        .returning({ id: leaderboardSnapshots.id });
      if (inserted.length) n++;
    }
    return n;
  }

  // ===== Admin =====
  // Hàng chờ xử lý = mọi snapshot chưa SENT (PENDING + APPROVED) để admin duyệt rồi trao trong cùng màn.
  async listPending() {
    return this.db
      .select()
      .from(leaderboardSnapshots)
      .where(ne(leaderboardSnapshots.rewardStatus, 'SENT'))
      .orderBy(desc(leaderboardSnapshots.periodStart), asc(leaderboardSnapshots.rank));
  }

  async approve(adminId: string, id: number) {
    const rows = await this.db
      .update(leaderboardSnapshots)
      .set({ rewardStatus: 'APPROVED' })
      .where(and(eq(leaderboardSnapshots.id, id), eq(leaderboardSnapshots.rewardStatus, 'PENDING')))
      .returning();
    if (rows.length === 0) throw new BusinessException('INVALID_STATE', 'Snapshot không ở PENDING');
    await this.db.transaction((tx) => this.audit.log(tx, adminId, 'leaderboard.approve', 'leaderboard_snapshot', String(id)));
    return rows[0];
  }

  async grant(adminId: string, id: number) {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .update(leaderboardSnapshots)
        .set({ rewardStatus: 'SENT', grantedAt: new Date() })
        .where(and(eq(leaderboardSnapshots.id, id), eq(leaderboardSnapshots.rewardStatus, 'APPROVED')))
        .returning();
      if (rows.length === 0) throw new BusinessException('INVALID_STATE', 'Snapshot phải APPROVED');
      const snap = rows[0];
      const cfg = (snap.rewardConfig as { gold?: number } | null) ?? null;
      const goldReward = cfg?.gold ?? (await this.config.get<number>('leaderboard.reward_gold', 0));
      if (goldReward > 0) {
        await lockUser(tx, snap.userId);
        await this.ledger.credit(tx, {
          userId: snap.userId,
          currency: 'GOLD',
          amount: goldReward,
          source: 'REWARD',
          realValueVnd: goldReward,
          refType: 'leaderboard',
          refId: String(id),
        });
      }
      await this.notification.create(tx, {
        userId: snap.userId,
        type: 'SYSTEM',
        title: `Chúc mừng Top ${snap.rank}!`,
        body: 'Bạn vào bảng xếp hạng. Vui lòng cung cấp thông tin nhận quà qua email được gửi tới bạn.',
        data: { leaderboardSnapshotId: id, rank: snap.rank, goldReward },
      });
      await this.audit.log(tx, adminId, 'leaderboard.grant', 'leaderboard_snapshot', String(id), { goldReward });
      return snap;
    });
  }
}
