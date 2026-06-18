import { registerAs } from '@nestjs/config';

// Access 15–30', Refresh xoay vòng. Secret ở env — KHÔNG vào platform_config (§11).
export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me-32chars',
  accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '1800', 10),
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me-32chars',
  refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10),
}));
