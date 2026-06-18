import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  // Giờ server UTC+7 khóa cứng — §0.4.
  timezone: process.env.TIMEZONE ?? 'Asia/Ho_Chi_Minh',
}));
