import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';

// Đối soát tiền — READ-ONLY trên wallet_ledger + donation_receipts + users. Tiền = source-of-truth Postgres (§18).

export interface SourceBreakdown {
  source: string;
  credited: number;
  debited: number;
  realValueVnd: number;
  count: number;
}

export interface ReconcileSummary {
  iapRevenueVnd: number;
  offerwallGoldIssued: number;
  donationFundVnd: number;
  flaggedUsers: number;
  negativeGoldUsers: number;
  bySource: SourceBreakdown[];
}

export interface AdminLedgerRow {
  id: number;
  userId: string;
  userName: string | null;
  currency: 'GREEN' | 'GOLD' | 'DIAMOND';
  amount: number;
  source: string;
  realValueVnd: number;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}

export interface ListLedgerQuery {
  source?: string;
  userId?: string;
  cursor?: string;
  limit?: number;
}

@Injectable()
export class ReconcileService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private async scalar(query: ReturnType<typeof sql>): Promise<number> {
    const res = await this.db.execute(query);
    return Number((res.rows[0] as { v: string | null })?.v ?? 0);
  }

  async summary(): Promise<ReconcileSummary> {
    const [iapRevenueVnd, offerwallGoldIssued, donationFundVnd, flaggedUsers, negativeGoldUsers] =
      await Promise.all([
        this.scalar(sql`SELECT COALESCE(SUM(real_value_vnd),0) AS v FROM wallet_ledger WHERE source='IAP_DIAMOND'`),
        this.scalar(sql`SELECT COALESCE(SUM(amount),0) AS v FROM wallet_ledger WHERE source='OFFERWALL' AND amount>0`),
        this.scalar(sql`SELECT COALESCE(SUM(donated_vnd),0) AS v FROM donation_receipts`),
        this.scalar(sql`SELECT COUNT(*) AS v FROM users WHERE is_flagged`),
        this.scalar(
          sql`SELECT COUNT(*) AS v FROM (SELECT user_id FROM wallet_ledger WHERE currency='GOLD' GROUP BY user_id HAVING SUM(amount)<0) t`,
        ),
      ]);

    const bySourceRes = await this.db.execute(sql`
      SELECT
        source,
        COALESCE(SUM(CASE WHEN amount>0 THEN amount ELSE 0 END),0) AS credited,
        COALESCE(SUM(CASE WHEN amount<0 THEN -amount ELSE 0 END),0) AS debited,
        COALESCE(SUM(real_value_vnd),0) AS real_value_vnd,
        COUNT(*) AS count
      FROM wallet_ledger
      GROUP BY source
      ORDER BY source
    `);
    const bySource: SourceBreakdown[] = bySourceRes.rows.map((r) => {
      const row = r as {
        source: string;
        credited: string;
        debited: string;
        real_value_vnd: string;
        count: string;
      };
      return {
        source: row.source,
        credited: Number(row.credited),
        debited: Number(row.debited),
        realValueVnd: Number(row.real_value_vnd),
        count: Number(row.count),
      };
    });

    return {
      iapRevenueVnd,
      offerwallGoldIssued,
      donationFundVnd,
      flaggedUsers,
      negativeGoldUsers,
      bySource,
    };
  }

  // Keyset pagination theo id desc (lt(id,cursor)). cursor = id dạng string. limit default 20 max 100.
  async listLedger(q: ListLedgerQuery): Promise<{ items: AdminLedgerRow[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(Number(q.limit) || 20, 1), 100);

    const conds = [sql`TRUE`];
    if (q.source) conds.push(sql`l.source = ${q.source}`);
    if (q.userId) conds.push(sql`l.user_id = ${q.userId}`);
    if (q.cursor) conds.push(sql`l.id < ${Number(q.cursor)}`);
    const where = sql.join(conds, sql` AND `);

    // Lấy limit+1 để xác định nextCursor.
    const res = await this.db.execute(sql`
      SELECT
        l.id AS id,
        l.user_id AS user_id,
        u.display_name AS user_name,
        l.currency AS currency,
        l.amount AS amount,
        l.source AS source,
        l.real_value_vnd AS real_value_vnd,
        l.ref_type AS ref_type,
        l.ref_id AS ref_id,
        l.created_at AS created_at
      FROM wallet_ledger l
      LEFT JOIN users u ON u.id = l.user_id
      WHERE ${where}
      ORDER BY l.id DESC
      LIMIT ${limit + 1}
    `);

    const rows = res.rows as Array<{
      id: number | string;
      user_id: string;
      user_name: string | null;
      currency: 'GREEN' | 'GOLD' | 'DIAMOND';
      amount: number | string;
      source: string;
      real_value_vnd: number | string;
      ref_type: string | null;
      ref_id: string | null;
      created_at: Date | string;
    }>;

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    const items: AdminLedgerRow[] = pageRows.map((r) => ({
      id: Number(r.id),
      userId: r.user_id,
      userName: r.user_name,
      currency: r.currency,
      amount: Number(r.amount),
      source: r.source,
      realValueVnd: Number(r.real_value_vnd),
      refType: r.ref_type,
      refId: r.ref_id,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));

    const nextCursor = hasMore ? String(items[items.length - 1].id) : null;
    return { items, nextCursor };
  }
}
