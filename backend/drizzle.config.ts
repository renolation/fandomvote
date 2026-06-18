import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://fdv:fdv@localhost:5432/fdv',
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
