import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { Idol, idolFollows, idols } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';

// Theo dõi idol — danh sách idol user đang follow + follow/unfollow idempotent.
@Injectable()
export class FollowService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // Idol user đang theo dõi, follow mới nhất trước.
  async listMine(userId: string): Promise<Idol[]> {
    const rows = await this.db
      .select({ idol: idols })
      .from(idolFollows)
      .innerJoin(idols, eq(idols.id, idolFollows.idolId))
      .where(eq(idolFollows.userId, userId))
      .orderBy(desc(idolFollows.createdAt));
    return rows.map((r) => r.idol);
  }

  // Follow idempotent — UNIQUE(user,idol) + onConflictDoNothing. 404 nếu idol không tồn tại.
  async follow(userId: string, idolId: string): Promise<{ followed: true }> {
    const found = await this.db
      .select({ id: idols.id })
      .from(idols)
      .where(eq(idols.id, idolId))
      .limit(1);
    if (found.length === 0) throw new BusinessException('NOT_FOUND', 'Idol không tồn tại');
    await this.db.insert(idolFollows).values({ userId, idolId }).onConflictDoNothing();
    return { followed: true };
  }

  async unfollow(userId: string, idolId: string): Promise<{ followed: false }> {
    await this.db
      .delete(idolFollows)
      .where(and(eq(idolFollows.userId, userId), eq(idolFollows.idolId, idolId)));
    return { followed: false };
  }
}
