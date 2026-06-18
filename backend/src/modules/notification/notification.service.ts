import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull, lt } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import { Notification, notifications } from '../../db/schema';
import { PaginatedResult, PaginationQueryDto } from '../../common/dto/pagination.dto';

type NotificationType = Notification['type'];

export interface NewNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // Nhận tx khi gọi trong transaction (resolution, vote...) — §1.2.
  async create(executor: DbOrTx, input: NewNotificationInput): Promise<void> {
    await executor.insert(notifications).values(input);
  }

  async createMany(executor: DbOrTx, inputs: NewNotificationInput[]): Promise<void> {
    if (inputs.length === 0) return;
    await executor.insert(notifications).values(inputs);
  }

  async list(userId: string, q: PaginationQueryDto): Promise<PaginatedResult<Notification>> {
    const conds = [eq(notifications.userId, userId)];
    if (q.cursor) conds.push(lt(notifications.id, q.cursor));
    const rows = await this.db
      .select()
      .from(notifications)
      .where(and(...conds))
      .orderBy(desc(notifications.id))
      .limit(q.limit + 1);
    const hasMore = rows.length > q.limit;
    const items = hasMore ? rows.slice(0, q.limit) : rows;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async unreadCount(userId: string): Promise<number> {
    const r = await this.db
      .select({ c: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return Number(r[0].c);
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }
}
