import 'dotenv/config';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import {
  campaignIdols,
  campaigns,
  dailyRewardsConfig,
  idols,
  partners,
  platformConfig,
  pointEvents,
  shopDeals,
  users,
  walletLedger,
} from '../schema';
import { normalizeName } from '../../common/utils/normalize-name.util';
import { db, pool } from '../drizzle.provider';

// ===== Config nghiệp vụ + daily rewards =====
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

// ===== Demo data (id cố định → re-run an toàn) =====
const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000002';
const CAMPAIGN_ID = '00000000-0000-4000-8000-000000000021';
const PARTNER_ID = '00000000-0000-4000-8000-000000000041';
const EVENT_ID = '00000000-0000-4000-8000-000000000061';

const DEMO_IDOLS = [
  { id: '00000000-0000-4000-8000-000000000011', name: 'Vũ Cát Tường Lee', votes: 1_284_500 },
  { id: '00000000-0000-4000-8000-000000000012', name: 'Hà Linh Đan', votes: 982_300 },
  { id: '00000000-0000-4000-8000-000000000013', name: 'Trần Bảo Khôi', votes: 845_100 },
  { id: '00000000-0000-4000-8000-000000000014', name: 'Ngọc Diệp', votes: 612_800 },
  { id: '00000000-0000-4000-8000-000000000015', name: 'Mai Phương', votes: 421_000 },
];

async function seedConfig(): Promise<void> {
  for (const c of CONFIGS) await db.insert(platformConfig).values(c).onConflictDoNothing();
  for (const r of DAILY_REWARDS) await db.insert(dailyRewardsConfig).values(r).onConflictDoNothing();
}

async function seedDemo(): Promise<void> {
  const exists = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.id, CAMPAIGN_ID)).limit(1);
  if (exists.length) {
    console.log('• demo đã seed trước đó — bỏ qua');
    return;
  }

  const now = new Date();
  const closeAt = new Date(now.getTime() + 30 * 86400000);
  const greenExp = new Date(now.getTime() + 5 * 86400000);
  const pwd = await argon2.hash('password123');

  // Users: admin + user demo (user có ví để xem số dư)
  await db
    .insert(users)
    .values([
      { id: ADMIN_ID, email: 'admin@fdv.vn', passwordHash: pwd, displayName: 'FDV Admin', role: 'ADMIN', emailVerifiedAt: now },
      { id: USER_ID, email: 'user@fdv.vn', passwordHash: pwd, displayName: 'Trang Nguyễn', fandom: 'Tường Lee Fanclub', emailVerifiedAt: now },
    ])
    .onConflictDoNothing();

  // Ví demo cho user (ledger append-only)
  await db
    .insert(walletLedger)
    .values([
      { userId: USER_ID, currency: 'GREEN', amount: 240, source: 'REFERRAL', expiresAt: greenExp, realValueVnd: 0 },
      { userId: USER_ID, currency: 'GOLD', amount: 1850, source: 'OFFERWALL', realValueVnd: 1850 },
      { userId: USER_ID, currency: 'DIAMOND', amount: 95, source: 'IAP_DIAMOND', realValueVnd: 95000 },
    ])
    .onConflictDoNothing();

  // Idols (đã duyệt)
  await db
    .insert(idols)
    .values(
      DEMO_IDOLS.map((i) => ({
        id: i.id,
        name: i.name,
        nameNormalized: normalizeName(i.name),
        status: 'APPROVED' as const,
        nominatedBy: ADMIN_ID,
      })),
    )
    .onConflictDoNothing();

  // Campaign OPEN
  await db
    .insert(campaigns)
    .values({
      id: CAMPAIGN_ID,
      title: '🔥 Mùa Hè 2026',
      description: 'Chiến dịch bình chọn idol mùa hè.',
      rulesContent:
        'Mỗi sao vote trừ Green trước, hết Green mới trừ Gold.\nIdol đầu tiên đạt Star Goal kích hoạt resolution.\nKhông idol nào đạt mốc → Gold quy đổi ×0,5 vào quỹ từ thiện.\nGreen có hạn sử dụng — dùng trước khi hết hạn.',
      starGoal: 1_500_000,
      donationRatioBps: 5000,
      status: 'OPEN',
      openAt: now,
      closeAt,
      createdBy: ADMIN_ID,
    })
    .onConflictDoNothing();

  // campaign_idols (leaderboard)
  await db
    .insert(campaignIdols)
    .values(
      DEMO_IDOLS.map((i, idx) => ({
        id: `00000000-0000-4000-8000-0000000000${31 + idx}`,
        campaignId: CAMPAIGN_ID,
        idolId: i.id,
        totalVotes: i.votes,
        addedBy: ADMIN_ID,
      })),
    )
    .onConflictDoNothing();

  // Partner + deals
  await db.insert(partners).values({ id: PARTNER_ID, name: 'FDV Official', type: 'OFFERWALL' }).onConflictDoNothing();
  await db
    .insert(shopDeals)
    .values([
      { id: '00000000-0000-4000-8000-000000000051', title: 'Voucher Highlands 50K', partnerId: PARTNER_ID, cost: 1200, currency: 'GOLD', itemType: 'DIGITAL', stock: 240, validityDays: 30 },
      { id: '00000000-0000-4000-8000-000000000052', title: 'Cặp vé phim CGV', partnerId: PARTNER_ID, cost: 3000, currency: 'GOLD', itemType: 'DIGITAL', stock: 80, validityDays: 30 },
      { id: '00000000-0000-4000-8000-000000000053', title: 'Lightstick FDV v2', partnerId: PARTNER_ID, cost: 150, currency: 'DIAMOND', itemType: 'PHYSICAL', stock: 35, validityDays: 60 },
    ])
    .onConflictDoNothing();

  // Point event ×2 GOLD đang diễn ra
  await db
    .insert(pointEvents)
    .values({
      id: EVENT_ID,
      title: '×2 GOLD',
      type: 'EARN_MULTIPLIER',
      multiplierBps: 20000,
      priority: 10,
      startsAt: new Date(now.getTime() - 3600000),
      endsAt: new Date(now.getTime() + 3 * 86400000),
    })
    .onConflictDoNothing();

  console.log('• seed demo: admin@fdv.vn + user@fdv.vn (password123), 5 idol, 1 campaign OPEN, 3 deal, 1 event');
}

async function main(): Promise<void> {
  await seedConfig();
  await seedDemo();
  console.log('✓ seed hoàn tất');
  await pool.end();
}

main().catch((err) => {
  console.error('seed failed', err);
  process.exit(1);
});
