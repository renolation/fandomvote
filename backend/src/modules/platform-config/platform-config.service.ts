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
}
