import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lt, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { greenDailyCounter, idempotencyKeys } from '../../db/schema';
import { addDays, vnDateString } from '../../common/utils/time.util';
import { CampaignService } from '../campaign/campaign.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { type BoardType, LeaderboardService } from '../leaderboard/leaderboard.service';

const BOARDS: BoardType[] = ['TOP_VOTER', 'TOP_EARNER'];

// Lazy-first, cron tối thiểu — §16. KHÔNG cron cho Green expiration (lazy qua query).
@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger('Scheduler');

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly campaign: CampaignService,
    private readonly leaderboard: LeaderboardService,
    private readonly analytics: AnalyticsService,
  ) {}

  // OPEN→CLOSED khi quá close_at + snapshot (atomic, idempotent).
  @Cron(CronExpression.EVERY_MINUTE)
  async closeDueCampaigns(): Promise<void> {
    const n = await this.campaign.closeDueCampaigns();
    if (n > 0) this.logger.log(`Đóng ${n} campaign quá hạn`);
  }

  // Dọn idempotency key hết hạn.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupIdempotency(): Promise<void> {
    await this.db.delete(idempotencyKeys).where(lt(idempotencyKeys.expiresAt, new Date()));
    this.logger.log('Dọn idempotency keys hết hạn');
  }

  // Prune green_daily_counter > 2 ngày.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async pruneGreenCounters(): Promise<void> {
    const cutoff = vnDateString(addDays(-2));
    await this.db.delete(greenDailyCounter).where(lt(greenDailyCounter.date, cutoff));
    this.logger.log(`Prune green_daily_counter < ${cutoff}`);
  }

  // Đối soát invariant §12 — alert khi lệch (Green/Diamond âm, stock vượt).
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async reconcile(): Promise<void> {
    const negBal = await this.db.execute(sql`
      SELECT user_id, currency, SUM(amount) AS total
      FROM wallet_ledger WHERE currency IN ('GREEN', 'DIAMOND')
      GROUP BY user_id, currency HAVING SUM(amount) < 0
    `);
    if (negBal.rows.length > 0) {
      this.logger.error(`RECONCILE: ${negBal.rows.length} balance Green/Diamond ÂM — cần điều tra`);
    }
    const overStock = await this.db.execute(sql`
      SELECT id FROM shop_deals WHERE stock_sold > stock
    `);
    if (overStock.rows.length > 0) {
      this.logger.error(`RECONCILE: ${overStock.rows.length} deal stock_sold > stock`);
    }
    this.logger.log('Đối soát invariant hoàn tất');
  }

  // Snapshot leaderboard kỳ trước + analytics nightly — §17/§18. TZ container = UTC+7.
  @Cron('5 0 * * *') // 00:05 mỗi ngày
  async dailySnapshotAndAnalytics(): Promise<void> {
    for (const b of BOARDS) await this.leaderboard.snapshotPreviousPeriod(b, 'DAY');
    await this.analytics.computeDaily();
    this.logger.log('Snapshot DAY + analytics nightly xong');
  }

  @Cron('10 0 * * 1') // 00:10 Thứ 2 — kỳ tuần trước
  async weeklySnapshot(): Promise<void> {
    for (const b of BOARDS) await this.leaderboard.snapshotPreviousPeriod(b, 'WEEK');
    this.logger.log('Snapshot WEEK xong');
  }

  @Cron('15 0 1 * *') // 00:15 ngày 1 — kỳ tháng trước
  async monthlySnapshot(): Promise<void> {
    for (const b of BOARDS) await this.leaderboard.snapshotPreviousPeriod(b, 'MONTH');
    this.logger.log('Snapshot MONTH xong');
  }
}
