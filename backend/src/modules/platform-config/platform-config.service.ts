import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { platformConfig } from '../../db/schema';
import { Database, DRIZZLE } from '../../db/drizzle.provider';

// Đọc hằng số nghiệp vụ từ platform_config (ratio, trần, hạn, contact) — §0.5/§14.
// KHÔNG chứa secret (secret ở env).
@Injectable()
export class PlatformConfigService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const rows = await this.db
      .select()
      .from(platformConfig)
      .where(eq(platformConfig.key, key))
      .limit(1);
    if (rows.length === 0) return fallback;
    return rows[0].value as T;
  }

  // Upsert 1 key (admin sửa cấu hình). description chỉ ghi khi được truyền, tránh xoá mô tả cũ.
  async set(key: string, value: unknown, description?: string): Promise<void> {
    await this.db
      .insert(platformConfig)
      .values({ key, value, description })
      .onConflictDoUpdate({
        target: platformConfig.key,
        set: { value, updatedAt: new Date(), ...(description ? { description } : {}) },
      });
  }
}
