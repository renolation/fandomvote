import 'dotenv/config';
import { dailyRewardsConfig, platformConfig } from '../schema';
import { db, pool } from '../drizzle.provider';

// Seed hằng số nghiệp vụ + daily rewards mặc định — §3/§14.
const CONFIGS: Array<{ key: string; value: unknown; description: string }> = [
  { key: 'green.daily_cap', value: 100, description: 'Trần Green earned/ngày' },
  { key: 'referral.green_reward', value: 500, description: 'Green thưởng referral (mỗi bên)' },
  { key: 'referral.green_expiry_days', value: 7, description: 'Hạn Green referral (ngày)' },
  { key: 'referral.max_rewarded', value: 50, description: 'Trần lượt mời được thưởng/user' },
  { key: 'daily.checkin_green', value: 50, description: 'Green check-in mặc định' },
  { key: 'contact.admin', value: { email: 'support@fdv.vn', zalo: '' }, description: 'Liên hệ admin' },
];

const DAILY_REWARDS = [
  { dayIndex: 1, greenAmount: 50 },
  { dayIndex: 2, greenAmount: 60 },
  { dayIndex: 3, greenAmount: 70 },
  { dayIndex: 4, greenAmount: 80 },
  { dayIndex: 5, greenAmount: 90 },
  { dayIndex: 6, greenAmount: 100 },
  { dayIndex: 7, greenAmount: 100 },
];

async function main(): Promise<void> {
  for (const c of CONFIGS) {
    await db.insert(platformConfig).values(c).onConflictDoNothing();
  }
  for (const r of DAILY_REWARDS) {
    await db.insert(dailyRewardsConfig).values(r).onConflictDoNothing();
  }
  console.log('✓ seed platform_config + daily_rewards');
  await pool.end();
}

main().catch((err) => {
  console.error('seed failed', err);
  process.exit(1);
});
