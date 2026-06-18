import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, lt } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { DbOrTx } from '../../db/types';
import { Idol, idols } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { normalizeName } from '../../common/utils/normalize-name.util';
import { PaginatedResult, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { NominateIdolDto } from './dto/nominate-idol.dto';

@Injectable()
export class IdolService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly audit: AuditService,
  ) {}

  // Check trùng real-time theo name_normalized — §7.
  async checkDuplicate(name: string): Promise<{ duplicate: boolean; idol?: Idol }> {
    const normalized = normalizeName(name);
    const rows = await this.db
      .select()
      .from(idols)
      .where(eq(idols.nameNormalized, normalized))
      .limit(1);
    return rows.length ? { duplicate: true, idol: rows[0] } : { duplicate: false };
  }

  async nominate(userId: string, dto: NominateIdolDto): Promise<Idol> {
    const normalized = normalizeName(dto.name);
    const dup = await this.db
      .select({ id: idols.id })
      .from(idols)
      .where(eq(idols.nameNormalized, normalized))
      .limit(1);
    if (dup.length) {
      throw new BusinessException('IDOL_DUPLICATE', 'Idol đã tồn tại — hãy vote idol có sẵn');
    }
    try {
      const rows = await this.db
        .insert(idols)
        .values({
          name: dto.name,
          nameNormalized: normalized,
          aliases: dto.aliases,
          avatarUrl: dto.avatarUrl,
          status: 'PENDING',
          nominatedBy: userId,
        })
        .returning();
      return rows[0];
    } catch (e) {
      if ((e as { code?: string })?.code === '23505') {
        throw new BusinessException('IDOL_DUPLICATE', 'Idol đã tồn tại');
      }
      throw e;
    }
  }

  async listApproved(
    q: PaginationQueryDto & { search?: string },
  ): Promise<PaginatedResult<Idol>> {
    const cursorId = q.cursor;
    const conds = [eq(idols.status, 'APPROVED')];
    if (q.search) conds.push(ilike(idols.name, `%${q.search}%`));
    if (cursorId) conds.push(lt(idols.id, cursorId));
    const rows = await this.db
      .select()
      .from(idols)
      .where(and(...conds))
      .orderBy(desc(idols.id))
      .limit(q.limit + 1);
    const hasMore = rows.length > q.limit;
    const items = hasMore ? rows.slice(0, q.limit) : rows;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async getById(id: string): Promise<Idol> {
    const rows = await this.db.select().from(idols).where(eq(idols.id, id)).limit(1);
    if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Idol không tồn tại');
    return rows[0];
  }

  // Admin duyệt — §7.
  async setStatus(
    adminId: string,
    idolId: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<Idol> {
    return this.db.transaction(async (tx: DbOrTx) => {
      const rows = await tx
        .update(idols)
        .set({ status, updatedAt: new Date() })
        .where(eq(idols.id, idolId))
        .returning();
      if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'Idol không tồn tại');
      await this.audit.log(tx, adminId, `idol.${status.toLowerCase()}`, 'idol', idolId);
      return rows[0];
    });
  }
}
