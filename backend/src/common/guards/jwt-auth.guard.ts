import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthUser } from '../decorators/current-user.decorator';
import { BusinessException } from '../exceptions/business.exception';

interface AccessPayload {
  sub: string;
  role: AuthUser['role'];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new BusinessException('TOKEN_INVALID', 'Missing bearer token');
    }
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(auth.slice(7), {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      (req as Request & { user: AuthUser }).user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new BusinessException('TOKEN_INVALID', 'Invalid or expired token');
    }
  }
}
