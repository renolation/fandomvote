import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppRole } from './roles.decorator';

export interface AuthUser {
  id: string;
  role: AppRole;
}

// @CurrentUser() user: AuthUser — lấy từ JwtAuthGuard gắn vào request.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthUser;
  },
);
