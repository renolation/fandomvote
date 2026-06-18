import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { refreshTokens, users } from '../../db/schema';
import { AppRole } from '../../common/decorators/roles.decorator';
import { BusinessException } from '../../common/exceptions/business.exception';
import { addSeconds } from '../../common/utils/time.util';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Access JWT + Refresh xoay vòng (lưu hash) + theft detection theo family — §11.
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private signAccess(userId: string, role: AppRole): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, role },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<number>('jwt.accessTtl'),
      },
    );
  }

  private async issueInFamily(userId: string, role: AppRole, familyId: string): Promise<TokenPair> {
    const accessTtl = this.config.get<number>('jwt.accessTtl')!;
    const refreshTtl = this.config.get<number>('jwt.refreshTtl')!;
    const accessToken = await this.signAccess(userId, role);
    const refreshPlain = randomBytes(32).toString('hex');
    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash: this.hash(refreshPlain),
      familyId,
      expiresAt: addSeconds(refreshTtl),
    });
    return { accessToken, refreshToken: refreshPlain, expiresIn: accessTtl };
  }

  async issueForUser(userId: string, role: AppRole): Promise<TokenPair> {
    return this.issueInFamily(userId, role, randomUUID());
  }

  // Rotation: revoke token cũ, cấp mới cùng family. Token đã revoke mà bị dùng lại = theft → revoke cả family.
  async rotate(refreshPlain: string): Promise<TokenPair> {
    const tokenHash = this.hash(refreshPlain);
    const rows = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    if (rows.length === 0) throw new BusinessException('TOKEN_INVALID', 'Refresh token không hợp lệ');
    const t = rows[0];

    if (t.revokedAt) {
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.familyId, t.familyId), isNull(refreshTokens.revokedAt)));
      throw new BusinessException('TOKEN_REUSE_DETECTED', 'Phát hiện tái sử dụng token — đăng nhập lại');
    }
    if (t.expiresAt.getTime() < Date.now()) {
      throw new BusinessException('TOKEN_INVALID', 'Refresh token hết hạn');
    }

    const u = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, t.userId))
      .limit(1);
    if (u.length === 0) throw new BusinessException('TOKEN_INVALID', 'User không tồn tại');

    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, t.id));
    return this.issueInFamily(t.userId, u[0].role, t.familyId);
  }

  async revoke(refreshPlain: string): Promise<void> {
    const tokenHash = this.hash(refreshPlain);
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)));
  }
}
