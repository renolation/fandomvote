import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

// Đọc header 'idempotency-key' cho vote/topup/redeem — §10.
export const IdempotencyKey = createParamDecorator(
  (required: boolean | undefined, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest();
    const key = req.headers['idempotency-key'] as string | undefined;
    if (required && !key) {
      throw new BadRequestException('Missing Idempotency-Key header');
    }
    return key;
  },
);
