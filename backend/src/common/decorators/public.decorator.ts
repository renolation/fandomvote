import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// Bỏ qua JwtAuthGuard cho endpoint công khai (login, register, webhook...).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
