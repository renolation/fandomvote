import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, lt, or, type SQL } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { User, users } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { PaginatedResult, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';

// Cột an toàn để trả cho admin (KHÔNG lộ password_hash / google_sub).
const adminCols = {
  id: users.id,
  email: users.email,
  phone: users.phone,
  displayName: users.displayName,
  fandom: users.fandom,
  avatarUrl: users.avatarUrl,
  role: users.role,
  authProvider: users.authProvider,
  emailVerifiedAt: users.emailVerifiedAt,
  phoneVerifiedAt: users.phoneVerifiedAt,
  isFlagged: users.isFlagged,
  createdAt: users.createdAt,
} as const;

export type AdminUserRow = Pick<
  User,
  | 'id'
  | 'email'
  | 'phone'
  | 'displayName'
  | 'fandom'
  | 'avatarUrl'
  | 'role'
  | 'authProvider'
  | 'emailVerifiedAt'
  | 'phoneVerifiedAt'
  | 'isFlagged'
  | 'createdAt'
>;

@Injectable()
export class UserService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly audit: AuditService,
  ) {}

  // Admin: liệt kê user (search email/SĐT/tên, lọc flagged, keyset theo id desc).
  async listForAdmin(
    q: PaginationQueryDto & { search?: string; flagged?: string },
  ): Promise<PaginatedResult<AdminUserRow>> {
    const conds: SQL[] = [];
    if (q.search) {
      const s = `%${q.search}%`;
      const match = or(ilike(users.email, s), ilike(users.displayName, s), ilike(users.phone, s));
      if (match) conds.push(match);
    }
    if (q.flagged === 'true') conds.push(eq(users.isFlagged, true));
    if (q.cursor) conds.push(lt(users.id, q.cursor));

    const rows = await this.db
      .select(adminCols)
      .from(users)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(users.id))
      .limit(q.limit + 1);

    const hasMore = rows.length > q.limit;
    const items = hasMore ? rows.slice(0, q.limit) : rows;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  // Admin: gắn/bỏ cờ gian lận. Ghi audit log trong cùng transaction.
  async setFlagged(adminId: string, userId: string, flagged: boolean): Promise<AdminUserRow> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .update(users)
        .set({ isFlagged: flagged, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning(adminCols);
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'User không tồn tại');
      await this.audit.log(tx, adminId, flagged ? 'user.flag' : 'user.unflag', 'user', userId);
      return rows[0];
    });
  }
}
