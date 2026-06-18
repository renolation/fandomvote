import { Inject, Injectable } from '@nestjs/common';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import { adminAuditLog } from '../../db/schema';

// Ghi vết hành động admin — immutable, cùng transaction với mutation — §11.
@Injectable()
export class AuditService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async log(
    executor: DbOrTx,
    adminId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await executor.insert(adminAuditLog).values({ adminId, action, targetType, targetId, metadata });
  }

  // Tiện ích ngoài transaction.
  async record(
    adminId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log(this.db, adminId, action, targetType, targetId, metadata);
  }
}
