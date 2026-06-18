import 'dotenv/config';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import {
  campaignIdols,
  campaignSnapshots,
  campaigns,
  dailyRewardsConfig,
  donationReceipts,
  giftWalletItems,
  idols,
  notifications,
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

// ===== Ngữ cảnh mở rộng: nhiều campaign + idol PENDING + notification + ví quà =====
const CAMP_OPEN2 = '00000000-0000-4000-8000-000000000201';
const CAMP_DRAFT = '00000000-0000-4000-8000-000000000202';
const CAMP_CLOSED = '00000000-0000-4000-8000-000000000203';
const CAMP_RESOLVED = '00000000-0000-4000-8000-000000000204';

const PENDING_IDOLS = [
  { id: '00000000-0000-4000-8000-000000000111', name: 'Lê Minh Quân' },
  { id: '00000000-0000-4000-8000-000000000112', name: 'Phạm Tú Hảo' },
  { id: '00000000-0000-4000-8000-000000000113', name: 'Vương Anh Tú' },
];
const MORE_IDOLS = [
  { id: '00000000-0000-4000-8000-000000000121', name: 'Đức Phúc' },
  { id: '00000000-0000-4000-8000-000000000122', name: 'Hòa Minzy' },
  { id: '00000000-0000-4000-8000-000000000123', name: 'Erik Nguyễn' },
  { id: '00000000-0000-4000-8000-000000000124', name: 'Mỹ Tâm' },
];

async function seedMore(): Promise<void> {
  const exists = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.id, CAMP_OPEN2)).limit(1);
  if (exists.length) {
    console.log('• ngữ cảnh mở rộng đã seed — bỏ qua');
    return;
  }
  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 86400000);

  // Idol PENDING (cho trang Duyệt) + APPROVED thêm
  await db
    .insert(idols)
    .values([
      ...PENDING_IDOLS.map((i) => ({ id: i.id, name: i.name, nameNormalized: normalizeName(i.name), status: 'PENDING' as const, nominatedBy: USER_ID })),
      ...MORE_IDOLS.map((i) => ({ id: i.id, name: i.name, nameNormalized: normalizeName(i.name), status: 'APPROVED' as const, nominatedBy: ADMIN_ID })),
    ])
    .onConflictDoNothing();

  // Campaigns: OPEN#2, DRAFT, CLOSED (sắp resolve), RESOLVED (có biên lai)
  await db
    .insert(campaigns)
    .values([
      { id: CAMP_OPEN2, title: 'Giọng Hát Vàng', description: 'Tìm kiếm giọng ca vàng 2026.', rulesContent: 'Green trừ trước, Gold sau. Top 1 đạt goal → resolution.', starGoal: 1_200_000, donationRatioBps: 5000, status: 'OPEN', openAt: now, closeAt: d(20), createdBy: ADMIN_ID },
      { id: CAMP_DRAFT, title: 'Idol Tân Binh Q3', description: 'Sắp mở — chưa gán idol.', starGoal: 2_000_000, donationRatioBps: 4000, status: 'DRAFT', createdBy: ADMIN_ID },
      { id: CAMP_CLOSED, title: 'Đại Nhạc Hội FDV', description: 'Đã đóng — chờ admin chạy resolution.', starGoal: 500_000, donationRatioBps: 5000, status: 'CLOSED', openAt: d(-10), closeAt: d(-1), closedAt: now, snapshottedAt: now, createdBy: ADMIN_ID },
      { id: CAMP_RESOLVED, title: 'Mùa Xuân 2025', description: 'Đã kết thúc — không đạt mốc, quỹ từ thiện.', starGoal: 3_000_000, donationRatioBps: 5000, status: 'RESOLVED', openAt: d(-40), closeAt: d(-10), closedAt: d(-10), snapshottedAt: d(-10), resolvedAt: d(-9), createdBy: ADMIN_ID },
    ])
    .onConflictDoNothing();

  // campaign_idols
  await db
    .insert(campaignIdols)
    .values([
      { id: '00000000-0000-4000-8000-000000000701', campaignId: CAMP_OPEN2, idolId: MORE_IDOLS[0].id, totalVotes: 900_000 },
      { id: '00000000-0000-4000-8000-000000000702', campaignId: CAMP_OPEN2, idolId: MORE_IDOLS[1].id, totalVotes: 650_000 },
      { id: '00000000-0000-4000-8000-000000000703', campaignId: CAMP_OPEN2, idolId: MORE_IDOLS[2].id, totalVotes: 430_000 },
      { id: '00000000-0000-4000-8000-000000000704', campaignId: CAMP_CLOSED, idolId: MORE_IDOLS[3].id, totalVotes: 620_000, reachedValueAt: d(-2) },
      { id: '00000000-0000-4000-8000-000000000705', campaignId: CAMP_CLOSED, idolId: MORE_IDOLS[0].id, totalVotes: 300_000 },
      { id: '00000000-0000-4000-8000-000000000706', campaignId: CAMP_RESOLVED, idolId: MORE_IDOLS[1].id, totalVotes: 1_200_000 },
      { id: '00000000-0000-4000-8000-000000000707', campaignId: CAMP_RESOLVED, idolId: MORE_IDOLS[2].id, totalVotes: 800_000 },
    ])
    .onConflictDoNothing();

  // Snapshot cho CLOSED + RESOLVED (resolution đọc snapshot đông cứng)
  await db
    .insert(campaignSnapshots)
    .values([
      { campaignId: CAMP_CLOSED, campaignIdolId: '00000000-0000-4000-8000-000000000704', idolId: MORE_IDOLS[3].id, rank: 1, totalVotes: 620_000, reachedValueAt: d(-2) },
      { campaignId: CAMP_CLOSED, campaignIdolId: '00000000-0000-4000-8000-000000000705', idolId: MORE_IDOLS[0].id, rank: 2, totalVotes: 300_000 },
      { campaignId: CAMP_RESOLVED, campaignIdolId: '00000000-0000-4000-8000-000000000706', idolId: MORE_IDOLS[1].id, rank: 1, totalVotes: 1_200_000 },
      { campaignId: CAMP_RESOLVED, campaignIdolId: '00000000-0000-4000-8000-000000000707', idolId: MORE_IDOLS[2].id, rank: 2, totalVotes: 800_000 },
    ])
    .onConflictDoNothing();

  // Biên lai quỹ cho campaign RESOLVED (outcome B)
  await db
    .insert(donationReceipts)
    .values({ campaignId: CAMP_RESOLVED, fundVnd: 1_400_000, goldTotal: 2_800_000, donationRatioBps: 5000, receiptNo: 'HEART-2026-0204', details: { note: 'demo' } })
    .onConflictDoNothing();

  // Notifications cho user demo (badge)
  await db
    .insert(notifications)
    .values([
      { id: '00000000-0000-4000-8000-000000000501', userId: USER_ID, type: 'REFERRAL', title: 'Thưởng mời', body: 'Bạn nhận 500 Green từ chương trình giới thiệu.' },
      { id: '00000000-0000-4000-8000-000000000502', userId: USER_ID, type: 'SHOP', title: 'Sự kiện ×2 GOLD', body: 'Sự kiện nhân đôi Gold đang diễn ra — còn vài ngày!' },
      { id: '00000000-0000-4000-8000-000000000503', userId: USER_ID, type: 'RESOLUTION', title: 'Kết quả Mùa Xuân 2025', body: 'Chiến dịch đã kết thúc, cảm ơn bạn đã đồng hành.', readAt: d(-1) },
    ])
    .onConflictDoNothing();

  // Ví quà cho user demo
  await db
    .insert(giftWalletItems)
    .values([
      { id: '00000000-0000-4000-8000-000000000601', userId: USER_ID, dealId: '00000000-0000-4000-8000-000000000051', itemType: 'DIGITAL', status: 'ACTIVE', code: 'HL50-4XQ9', expiresAt: d(30) },
      { id: '00000000-0000-4000-8000-000000000602', userId: USER_ID, dealId: '00000000-0000-4000-8000-000000000053', itemType: 'PHYSICAL', status: 'PENDING', expiresAt: d(20) },
    ])
    .onConflictDoNothing();

  console.log('• seed mở rộng: +4 campaign (OPEN/DRAFT/CLOSED/RESOLVED), 3 idol PENDING, 4 idol APPROVED, 3 notification, 2 quà');
}

async function main(): Promise<void> {
  await seedConfig();
  await seedDemo();
  await seedMore();
  console.log('✓ seed hoàn tất');
  await pool.end();
}

main().catch((err) => {
  console.error('seed failed', err);
  process.exit(1);
});
