import { Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { User, users } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ReferralService } from '../referral/referral.service';
import { GoogleAuthService } from './google-auth.service';
import { TokenService, TokenPair } from './token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthDto } from './dto/auth-tokens.dto';

type PublicUser = Omit<User, 'passwordHash'>;
type AuthResult = TokenPair & { user: PublicUser };

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly token: TokenService,
    private readonly referral: ReferralService,
    private readonly google: GoogleAuthService,
  ) {}

  private sanitize(u: User): PublicUser {
    const { passwordHash: _omit, ...rest } = u;
    return rest;
  }

  async register(dto: RegisterDto, ip?: string): Promise<AuthResult> {
    if (!dto.email && !dto.phone) {
      throw new BusinessException('VALIDATION_ERROR', 'Cần email hoặc số điện thoại');
    }
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.db.transaction(async (tx) => {
      let created: User;
      try {
        const rows = await tx
          .insert(users)
          .values({
            email: dto.email,
            phone: dto.phone,
            passwordHash,
            displayName: dto.displayName,
            authProvider: 'LOCAL',
            signupIp: ip,
            deviceFingerprint: dto.deviceFingerprint,
          })
          .returning();
        created = rows[0];
      } catch (e) {
        if ((e as { code?: string })?.code === '23505') {
          throw new BusinessException('CONFLICT', 'Email/SĐT đã tồn tại');
        }
        throw e;
      }
      if (dto.referralCode) {
        await this.referral.createPendingReferral(tx, dto.referralCode, created.id, ip, dto.deviceFingerprint);
      }
      return created;
    });

    const tokens = await this.token.issueForUser(user.id, user.role);
    return { ...tokens, user: this.sanitize(user) };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const cond = dto.email
      ? eq(users.email, dto.email)
      : dto.phone
        ? eq(users.phone, dto.phone)
        : null;
    if (!cond) throw new BusinessException('VALIDATION_ERROR', 'Cần email hoặc số điện thoại');

    const rows = await this.db.select().from(users).where(cond).limit(1);
    const user = rows[0];
    if (!user || !user.passwordHash) {
      throw new BusinessException('INVALID_CREDENTIALS', 'Sai thông tin đăng nhập');
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new BusinessException('INVALID_CREDENTIALS', 'Sai thông tin đăng nhập');

    const tokens = await this.token.issueForUser(user.id, user.role);
    return { ...tokens, user: this.sanitize(user) };
  }

  async googleLogin(dto: GoogleAuthDto, ip?: string): Promise<AuthResult> {
    const p = await this.google.verify(dto.idToken);

    const bySub = await this.db.select().from(users).where(eq(users.googleSub, p.sub)).limit(1);
    let user = bySub[0];
    if (!user) {
      const byEmail = await this.db.select().from(users).where(eq(users.email, p.email)).limit(1);
      user = byEmail[0];
      if (user && !user.googleSub) {
        await this.db.update(users).set({ googleSub: p.sub }).where(eq(users.id, user.id));
      }
    }

    if (!user) {
      user = await this.db.transaction(async (tx) => {
        const rows = await tx
          .insert(users)
          .values({
            email: p.email,
            googleSub: p.sub,
            authProvider: 'GOOGLE',
            displayName: p.name,
            emailVerifiedAt: p.emailVerified ? new Date() : null,
            signupIp: ip,
            deviceFingerprint: dto.deviceFingerprint,
          })
          .returning();
        const created = rows[0];
        if (dto.referralCode) {
          await this.referral.createPendingReferral(tx, dto.referralCode, created.id, ip, dto.deviceFingerprint);
          // Email Google đã verified → thưởng referral ngay.
          if (p.emailVerified) await this.referral.rewardOnVerify(tx, created.id);
        }
        return created;
      });
    }

    const tokens = await this.token.issueForUser(user.id, user.role);
    return { ...tokens, user: this.sanitize(user) };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const rows = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (rows.length === 0) throw new BusinessException('NOT_FOUND', 'User không tồn tại');
    return this.sanitize(rows[0]);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    return this.token.rotate(refreshToken);
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    await this.token.revoke(refreshToken);
    return { success: true };
  }
}
