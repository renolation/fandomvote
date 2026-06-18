import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './drizzle.provider';

// Chạy migration đã generate (drizzle-kit). KHÔNG sửa file migration đã chạy — §14.
async function main() {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('✓ migrations applied');
  await pool.end();
}

main().catch((err) => {
  console.error('migration failed', err);
  process.exit(1);
});
