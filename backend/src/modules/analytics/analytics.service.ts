import { Inject, Injectable } from '@nestjs/common';
import { desc, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { dailyMetrics } from '../../db/schema';
import { periodRange, vnDateString } from '../../common/utils/time.util';

// Tiền = source-of-truth Postgres; KHÔNG đẩy ra tool ngoài — §18.
@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private async scalar(query: ReturnType<typeof sql>): Promise<number> {
    const res = await this.db.execute(query);
    return Number((res.rows[0] as { v: string }).v);
  }

  // Job nightly: tổng hợp ledger/vote_logs của 1 ngày (mặc định hôm qua UTC+7) → daily_metrics (upsert).
  async computeDaily(base: Date = new Date(Date.now() - 86400000)): Promise<void> {
    const { start, end } = periodRange('DAY', base);
    const w7 = new Date(end.getTime() - 7 * 86400000);
    const w30 = new Date(end.getTime() - 30 * 86400000);
    const metricDate = vnDateString(base);

    const g = (cur: string, sign: '>' | '<') =>
      sql`SELECT COALESCE(SUM(ABS(amount)),0) AS v FROM wallet_ledger WHERE currency=${cur} AND amount ${sql.raw(sign)} 0 AND created_at >= ${start} AND created_at < ${end}`;

    const [
      revenueVnd,
      adRevenueGold,
      topupDiamond,
      goldIssued,
      goldSpent,
      goldLiability,
      greenEarned,
      greenSpent,
      totalVotes,
      voteGreen,
      voteGold,
      eventBonusCost,
      dau,
      wau,
      mau,
      newUsers,
    ] = await Promise.all([
      this.scalar(sql`SELECT COALESCE(SUM(real_value_vnd),0) AS v FROM wallet_ledger WHERE source='IAP_DIAMOND' AND created_at >= ${start} AND created_at < ${end}`),
      this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM wallet_ledger WHERE source='OFFERWALL' AND amount>0 AND created_at >= ${start} AND created_at < ${end}`),
      this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM wallet_ledger WHERE source='IAP_DIAMOND' AND amount>0 AND created_at >= ${start} AND created_at < ${end}`),
      this.scalar(g('GOLD', '>')),
      this.scalar(g('GOLD', '<')),
      this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM wallet_ledger WHERE currency='GOLD'`),
      this.scalar(g('GREEN', '>')),
      this.scalar(g('GREEN', '<')),
      this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM vote_logs WHERE is_reversal=false AND created_at >= ${start} AND created_at < ${end}`),
      this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM vote_logs WHERE is_reversal=false AND currency='GREEN' AND created_at >= ${start} AND created_at < ${end}`),
      this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM vote_logs WHERE is_reversal=false AND currency='GOLD' AND created_at >= ${start} AND created_at < ${end}`),
      this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM wallet_ledger WHERE source='EVENT_BONUS' AND created_at >= ${start} AND created_at < ${end}`),
      this.scalar(sql`SELECT COUNT(DISTINCT user_id) AS v FROM wallet_ledger WHERE created_at >= ${start} AND created_at < ${end}`),
      this.scalar(sql`SELECT COUNT(DISTINCT user_id) AS v FROM wallet_ledger WHERE created_at >= ${w7} AND created_at < ${end}`),
      this.scalar(sql`SELECT COUNT(DISTINCT user_id) AS v FROM wallet_ledger WHERE created_at >= ${w30} AND created_at < ${end}`),
      this.scalar(sql`SELECT COUNT(*) AS v FROM users WHERE created_at >= ${start} AND created_at < ${end}`),
    ]);

    const row = {
      metricDate,
      dau,
      wau,
      mau,
      newUsers,
      revenueVnd,
      adRevenueGold,
      topupDiamond,
      goldIssued,
      goldSpent,
      goldLiability,
      greenEarned,
      greenSpent,
      greenExpired: 0, // lazy expiration — không track chính xác, để 0
      totalVotes,
      voteGreen,
      voteGold,
      eventBonusCost,
      computedAt: new Date(),
    };
    await this.db
      .insert(dailyMetrics)
      .values(row)
      .onConflictDoUpdate({ target: dailyMetrics.metricDate, set: row });
  }

  // Admin dashboard: thẻ tổng quan + currency health (live) + 30 ngày gần nhất.
  async getOverview() {
    const [goldLiability, goldIssued, goldSpent, greenIssued, greenSpent, totalFundVnd] =
      await Promise.all([
        this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM wallet_ledger WHERE currency='GOLD'`),
        this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM wallet_ledger WHERE currency='GOLD' AND amount>0`),
        this.scalar(sql`SELECT COALESCE(SUM(ABS(amount)),0) AS v FROM wallet_ledger WHERE currency='GOLD' AND amount<0`),
        this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM wallet_ledger WHERE currency='GREEN' AND amount>0`),
        this.scalar(sql`SELECT COALESCE(SUM(ABS(amount)),0) AS v FROM wallet_ledger WHERE currency='GREEN' AND amount<0`),
        this.scalar(sql`SELECT COALESCE(SUM(donated_vnd),0) AS v FROM donation_receipts`),
      ]);
    const ratio = (spent: number, issued: number) => (issued > 0 ? +(spent / issued).toFixed(3) : 0);
    const recent = await this.db
      .select()
      .from(dailyMetrics)
      .orderBy(desc(dailyMetrics.metricDate))
      .limit(30);

    return {
      currencyHealth: {
        goldLiability,
        goldSinkSource: ratio(goldSpent, goldIssued),
        greenSinkSource: ratio(greenSpent, greenIssued),
        totalFundVnd,
        inflationWarning: goldIssued > 0 && goldSpent / goldIssued < 1,
      },
      recent,
    };
  }
}
