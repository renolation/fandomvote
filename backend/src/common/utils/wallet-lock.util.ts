import { sql } from 'drizzle-orm';
import { DbOrTx } from '../../db/types';

// Serialize toàn bộ thao tác ví của 1 user trong transaction hiện tại — §1/§5.
// pg_advisory_xact_lock (xact-scoped) hợp pgBouncer transaction mode. Tự nhả khi commit.
export async function lockUser(tx: DbOrTx, userId: string): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
}
