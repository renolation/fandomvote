import 'dotenv/config';
import * as argon2 from 'argon2';
import { and, eq, isNull } from 'drizzle-orm';
import {
  campaignIdols,
  campaignSnapshots,
  campaigns,
  dailyMetrics,
  dailyRewardsConfig,
  donationReceipts,
  giftWalletItems,
  iapPackages,
  idolFollows,
  idols,
  leaderboardSnapshots,
  notifications,
  offerTasks,
  partners,
  platformConfig,
  pointEvents,
  referrals,
  shippingAddresses,
  shopDeals,
  users,
  voteLogs,
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
      { id: ADMIN_ID, email: 'admin@fdv.vn', username: 'admin', passwordHash: pwd, displayName: 'FDV Admin', role: 'ADMIN', emailVerifiedAt: now },
      { id: USER_ID, email: 'user@fdv.vn', username: 'trang', passwordHash: pwd, displayName: 'Trang Nguyễn', fandom: 'Tường Lee Fanclub', emailVerifiedAt: now },
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
      prize: 'Billboard LED Times Square HCM 1 tuần + bộ ảnh concept',
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

  // Thêm point_events phủ mọi trạng thái: 2 đang diễn ra, 2 sắp tới, 2 đã qua
  // (trang 🎉 Sự kiện hiển thị filter ongoing/upcoming/past)
  await db
    .insert(pointEvents)
    .values([
      // 2 ĐANG DIỄN RA (startsAt < now < endsAt, isActive true)
      { id: '00000000-0000-4000-8000-0000000009b1', title: '×2 Gold cuối tuần', type: 'EARN_MULTIPLIER', targetCurrency: 'GOLD', multiplierBps: 20000, priority: 8, startsAt: new Date(now.getTime() - 2 * 86400000), endsAt: new Date(now.getTime() + 2 * 86400000), bannerText: 'Nhân đôi Gold mọi nhiệm vụ cuối tuần!', isActive: true },
      { id: '00000000-0000-4000-8000-0000000009b2', title: 'Nạp Diamond +50%', type: 'TOPUP_MULTIPLIER', targetCurrency: 'DIAMOND', multiplierBps: 15000, priority: 7, startsAt: new Date(now.getTime() - 86400000), endsAt: new Date(now.getTime() + 4 * 86400000), bannerText: 'Nạp Diamond nhận thêm 50% giá trị.', isActive: true },
      // 2 SẮP TỚI (startsAt > now)
      { id: '00000000-0000-4000-8000-0000000009b3', title: '×3 Green ngày lễ', type: 'EARN_MULTIPLIER', targetCurrency: 'GREEN', multiplierBps: 30000, priority: 9, startsAt: new Date(now.getTime() + 5 * 86400000), endsAt: new Date(now.getTime() + 7 * 86400000), bannerText: 'Sắp tới: nhân ba Green dịp lễ!', isActive: true },
      { id: '00000000-0000-4000-8000-0000000009b4', title: 'Nạp Diamond +100% Tết', type: 'TOPUP_MULTIPLIER', targetCurrency: 'DIAMOND', multiplierBps: 30000, priority: 9, startsAt: new Date(now.getTime() + 10 * 86400000), endsAt: new Date(now.getTime() + 14 * 86400000), bannerText: 'Tết về: nạp Diamond x2 giá trị!', isActive: true },
      // 2 ĐÃ QUA (endsAt < now, isActive false)
      { id: '00000000-0000-4000-8000-0000000009b5', title: '×2 Gold tháng trước', type: 'EARN_MULTIPLIER', targetCurrency: 'GOLD', multiplierBps: 20000, priority: 5, startsAt: new Date(now.getTime() - 40 * 86400000), endsAt: new Date(now.getTime() - 10 * 86400000), bannerText: 'Sự kiện đã kết thúc.', isActive: false },
      { id: '00000000-0000-4000-8000-0000000009b6', title: 'Nạp Diamond +50% hè rồi', type: 'TOPUP_MULTIPLIER', targetCurrency: 'DIAMOND', multiplierBps: 15000, priority: 4, startsAt: new Date(now.getTime() - 30 * 86400000), endsAt: new Date(now.getTime() - 8 * 86400000), bannerText: 'Sự kiện đã kết thúc.', isActive: false },
    ])
    .onConflictDoNothing();

  // Offer wall (kiếm Gold) — danh mục; Gold cộng qua webhook offerwall postback
  await db
    .insert(offerTasks)
    .values([
      { id: '00000000-0000-4000-8000-000000000061', title: 'Xem video 30 giây', icon: '🎬', iconBg: '#FB7185', rewardGold: 20, sortOrder: 1 },
      { id: '00000000-0000-4000-8000-000000000062', title: 'Hoàn thành khảo sát', icon: '📝', iconBg: '#3B82F6', rewardGold: 50, sortOrder: 2 },
      { id: '00000000-0000-4000-8000-000000000063', title: 'Mời bạn bè', icon: '👥', iconBg: '#22C55E', rewardGold: 100, sortOrder: 3 },
      { id: '00000000-0000-4000-8000-000000000064', title: 'Theo dõi fanpage', icon: '❤️', iconBg: '#FFD60A', rewardGold: 15, sortOrder: 4 },
    ])
    .onConflictDoNothing();

  // Gói nạp Diamond (IAP) — Diamond cộng qua webhook IAP + receipt verify
  await db
    .insert(iapPackages)
    .values([
      { id: '00000000-0000-4000-8000-000000000071', sku: 'dia_100', title: '100 Diamond', diamondAmount: 100, bonusDiamond: 0, priceVnd: 10000 },
      { id: '00000000-0000-4000-8000-000000000072', sku: 'dia_550', title: '550 Diamond', diamondAmount: 500, bonusDiamond: 50, priceVnd: 50000 },
      { id: '00000000-0000-4000-8000-000000000073', sku: 'dia_1200', title: '1.200 Diamond', diamondAmount: 1200, bonusDiamond: 0, priceVnd: 100000 },
      { id: '00000000-0000-4000-8000-000000000074', sku: 'dia_6500', title: '6.500 Diamond', diamondAmount: 5000, bonusDiamond: 1500, priceVnd: 500000 },
    ])
    .onConflictDoNothing();

  console.log('• seed demo: admin@fdv.vn (@admin) + user@fdv.vn (@trang) (password123), 5 idol, 1 campaign OPEN (prize LED Times Square), 3 deal, 7 point_events (2 ongoing/2 upcoming/2 past + ×2 GOLD), 4 offer, 4 iap');
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
      { id: CAMP_OPEN2, title: 'Giọng Hát Vàng', description: 'Tìm kiếm giọng ca vàng 2026.', rulesContent: 'Green trừ trước, Gold sau. Top 1 đạt goal → resolution.', starGoal: 1_200_000, donationRatioBps: 5000, prize: 'Suất biểu diễn mở màn liveshow + bộ ảnh concept', status: 'OPEN', openAt: now, closeAt: d(20), createdBy: ADMIN_ID },
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

  // Biên lai quỹ PER-USER cho campaign RESOLVED (outcome B) — demo 1 voter
  await db
    .insert(donationReceipts)
    .values({ campaignId: CAMP_RESOLVED, userId: USER_ID, goldVoted: 2_800_000, donatedVnd: 1_400_000, donationRatioBps: 5000, receiptNo: 'HEART-2026-0204-user' })
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

  console.log('• seed mở rộng: +4 campaign (OPEN#2 prize liveshow/DRAFT/CLOSED/RESOLVED), 3 idol PENDING, 4 idol APPROVED, 3 notification, 2 quà');
}

// ===== Kịch bản đầy đủ (block 09xx): vote_logs, referral, BXH, analytics, đơn hàng, kết quả A/C =====
// User phụ
const REFEREE_REWARDED_ID = '00000000-0000-4000-8000-000000000901';
const REFEREE_PENDING_ID = '00000000-0000-4000-8000-000000000902';
const UNVERIFIED_USER_ID = '00000000-0000-4000-8000-000000000903';
const FLAGGED_USER_ID = '00000000-0000-4000-8000-000000000904';
// Idol mới
const IDOL_REJECTED_ID = '00000000-0000-4000-8000-000000000911'; // user đề cử, bị từ chối
const IDOL_WINNER_A_ID = '00000000-0000-4000-8000-000000000912'; // outcome A — đạt mốc
const IDOL_NOWIN_C_ID = '00000000-0000-4000-8000-000000000913'; // outcome C — không đạt
// Campaign RESOLVED mới
const CAMP_RESOLVED_A = '00000000-0000-4000-8000-000000000921'; // outcome A (có winner, không quỹ)
const CAMP_RESOLVED_C = '00000000-0000-4000-8000-000000000922'; // outcome C (không winner, không quỹ)

async function seedScenarios(): Promise<void> {
  const exists = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.id, CAMP_RESOLVED_A)).limit(1);
  if (exists.length) {
    console.log('• kịch bản đầy đủ đã seed — bỏ qua');
    return;
  }
  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 86400000);
  const h = (hours: number) => new Date(now.getTime() + hours * 3600000);
  // Ngày dạng 'YYYY-MM-DD' (UTC) cho daily_metrics + biên kỳ BXH tuần trước
  const dateStr = (days: number) => d(days).toISOString().slice(0, 10);
  const pwd = await argon2.hash('password123');

  // 1) Users phụ: 2 referee + 1 chưa verify + 1 bị gắn cờ
  await db
    .insert(users)
    .values([
      { id: REFEREE_REWARDED_ID, email: 'referee1@fdv.vn', username: 'referee1', passwordHash: pwd, displayName: 'Bạn Mời A', emailVerifiedAt: d(-6) },
      { id: REFEREE_PENDING_ID, email: 'referee2@fdv.vn', username: 'referee2', passwordHash: pwd, displayName: 'Bạn Mời B', emailVerifiedAt: d(-2) },
      { id: UNVERIFIED_USER_ID, email: 'unverified@fdv.vn', username: 'chuaxacthuc', passwordHash: pwd, displayName: 'Chưa Xác Thực' }, // emailVerifiedAt null
      { id: FLAGGED_USER_ID, email: 'flagged@fdv.vn', username: 'flagged', passwordHash: pwd, displayName: 'Tài Khoản Gắn Cờ', emailVerifiedAt: d(-3), isFlagged: true },
    ])
    .onConflictDoNothing();

  // 6) Idol bị TỪ CHỐI do user demo đề cử (trang "Đề cử của tôi" hiện badge REJECTED)
  // + idol cho 2 kịch bản kết quả mới
  await db
    .insert(idols)
    .values([
      { id: IDOL_REJECTED_ID, name: 'Nguyễn Văn Bị Loại', nameNormalized: normalizeName('Nguyễn Văn Bị Loại'), status: 'REJECTED' as const, nominatedBy: USER_ID },
      { id: IDOL_WINNER_A_ID, name: 'Sơn Tùng MTP', nameNormalized: normalizeName('Sơn Tùng MTP'), status: 'APPROVED' as const, nominatedBy: ADMIN_ID },
      { id: IDOL_NOWIN_C_ID, name: 'Bích Phương Idol', nameNormalized: normalizeName('Bích Phương Idol'), status: 'APPROVED' as const, nominatedBy: ADMIN_ID },
    ])
    .onConflictDoNothing();

  // 8) Campaign RESOLVED — outcome A (có winner đạt mốc) + outcome C (không winner, không quỹ)
  await db
    .insert(campaigns)
    .values([
      { id: CAMP_RESOLVED_A, title: 'Siêu Sao Mùa Đông', description: 'Đã kết thúc — có nhà vô địch đạt Star Goal.', rulesContent: 'Top 1 đạt goal → kích hoạt Vote LED.', starGoal: 1_000_000, donationRatioBps: 5000, status: 'RESOLVED', openAt: d(-30), closeAt: d(-5), closedAt: d(-5), snapshottedAt: d(-5), resolvedAt: d(-4), createdBy: ADMIN_ID },
      { id: CAMP_RESOLVED_C, title: 'Thử Thách Tân Binh', description: 'Đã kết thúc — không idol nào đạt mốc, không có quỹ.', rulesContent: 'Không đạt mốc → an ủi, không gây quỹ.', starGoal: 5_000_000, donationRatioBps: 5000, status: 'RESOLVED', openAt: d(-30), closeAt: d(-6), closedAt: d(-6), snapshottedAt: d(-6), resolvedAt: d(-5), createdBy: ADMIN_ID },
    ])
    .onConflictDoNothing();

  // campaign_idols cho 2 campaign mới (outcome A có reachedValueAt, outcome C không)
  await db
    .insert(campaignIdols)
    .values([
      { id: '00000000-0000-4000-8000-000000000931', campaignId: CAMP_RESOLVED_A, idolId: IDOL_WINNER_A_ID, totalVotes: 1_050_000, reachedValueAt: d(-6), addedBy: ADMIN_ID },
      { id: '00000000-0000-4000-8000-000000000932', campaignId: CAMP_RESOLVED_C, idolId: IDOL_NOWIN_C_ID, totalVotes: 480_000, addedBy: ADMIN_ID },
    ])
    .onConflictDoNothing();

  // campaign_snapshots: outcome A có reachedValueAt (winner), outcome C không có
  await db
    .insert(campaignSnapshots)
    .values([
      { campaignId: CAMP_RESOLVED_A, campaignIdolId: '00000000-0000-4000-8000-000000000931', idolId: IDOL_WINNER_A_ID, rank: 1, totalVotes: 1_050_000, reachedValueAt: d(-6) },
      { campaignId: CAMP_RESOLVED_C, campaignIdolId: '00000000-0000-4000-8000-000000000932', idolId: IDOL_NOWIN_C_ID, rank: 1, totalVotes: 480_000 },
    ])
    .onConflictDoNothing();
  // Lưu ý: 2 campaign này KHÔNG có donation_receipts (outcome A → Vote LED; outcome C → an ủi)

  // 1') vote_logs cho user demo: trộn GREEN + GOLD trên campaign hiện có (Top Voter + lịch sử vote)
  // CAMPAIGN_ID dùng campaign_idols 0031/0032; CAMP_OPEN2 dùng 0701/0702
  await db
    .insert(voteLogs)
    .values([
      { userId: USER_ID, campaignId: CAMPAIGN_ID, campaignIdolId: '00000000-0000-4000-8000-000000000031', currency: 'GREEN', amount: 120, realValueVnd: 0, runningTotal: 1_284_620, isReversal: false, createdAt: h(-30) },
      { userId: USER_ID, campaignId: CAMPAIGN_ID, campaignIdolId: '00000000-0000-4000-8000-000000000031', currency: 'GOLD', amount: 800, realValueVnd: 800, runningTotal: 1_285_420, isReversal: false, createdAt: h(-26) },
      { userId: USER_ID, campaignId: CAMPAIGN_ID, campaignIdolId: '00000000-0000-4000-8000-000000000032', currency: 'GREEN', amount: 60, realValueVnd: 0, runningTotal: 982_360, isReversal: false, createdAt: h(-20) },
      { userId: USER_ID, campaignId: CAMP_OPEN2, campaignIdolId: '00000000-0000-4000-8000-000000000701', currency: 'GOLD', amount: 500, realValueVnd: 500, runningTotal: 900_500, isReversal: false, createdAt: h(-12) },
      { userId: USER_ID, campaignId: CAMP_OPEN2, campaignIdolId: '00000000-0000-4000-8000-000000000702', currency: 'GREEN', amount: 40, realValueVnd: 0, runningTotal: 650_040, isReversal: false, createdAt: h(-6) },
      { userId: USER_ID, campaignId: CAMP_OPEN2, campaignIdolId: '00000000-0000-4000-8000-000000000701', currency: 'GOLD', amount: 300, realValueVnd: 300, runningTotal: 900_800, isReversal: false, createdAt: h(-2) },
    ])
    .onConflictDoNothing();

  // 2) referrals: referrerId = user demo. 1 REWARDED (>=500 Gold lũy kế) + 1 PENDING → invited=2, rewarded=1
  await db
    .insert(referrals)
    .values([
      { id: '00000000-0000-4000-8000-000000000961', referrerId: USER_ID, refereeId: REFEREE_REWARDED_ID, status: 'REWARDED', refereeGoldEarned: 650, rewardedAt: d(-5), createdAt: d(-6) },
      { id: '00000000-0000-4000-8000-000000000962', referrerId: USER_ID, refereeId: REFEREE_PENDING_ID, status: 'PENDING', refereeGoldEarned: 120, createdAt: d(-2) },
    ])
    .onConflictDoNothing();

  // 3) leaderboard_snapshots: PENDING reward cho trang "Thưởng BXH" (kỳ tuần trước)
  // Unique (boardType, period, periodStart, rank) — periodStart cố định cho cả 4 dòng tuần trước
  const weekStart = d(-7);
  const weekEnd = d(-1);
  await db
    .insert(leaderboardSnapshots)
    .values([
      { boardType: 'TOP_VOTER', period: 'WEEK', periodStart: weekStart, periodEnd: weekEnd, userId: USER_ID, rank: 1, score: 1_700, rewardStatus: 'PENDING' },
      { boardType: 'TOP_VOTER', period: 'WEEK', periodStart: weekStart, periodEnd: weekEnd, userId: REFEREE_REWARDED_ID, rank: 2, score: 640, rewardStatus: 'PENDING' },
      { boardType: 'TOP_EARNER', period: 'WEEK', periodStart: weekStart, periodEnd: weekEnd, userId: USER_ID, rank: 1, score: 1_850, rewardStatus: 'PENDING' },
      { boardType: 'TOP_EARNER', period: 'WEEK', periodStart: weekStart, periodEnd: weekEnd, userId: REFEREE_REWARDED_ID, rank: 2, score: 650, rewardStatus: 'PENDING' },
    ])
    .onConflictDoNothing();

  // 4) daily_metrics: 5 ngày gần nhất (job nightly đọc ledger → ghi; ở đây seed số liệu hợp lý)
  await db
    .insert(dailyMetrics)
    .values([
      { metricDate: dateStr(-5), dau: 820, wau: 3_100, mau: 9_800, newUsers: 64, revenueVnd: 4_200_000, adRevenueGold: 18_000, topupDiamond: 6_400, goldIssued: 52_000, goldSpent: 41_000, goldLiability: 1_180_000, greenEarned: 30_000, greenSpent: 22_000, greenExpired: 1_200, totalVotes: 96_000, voteGreen: 54_000, voteGold: 42_000, eventBonusCost: 3_500 },
      { metricDate: dateStr(-4), dau: 905, wau: 3_240, mau: 9_950, newUsers: 71, revenueVnd: 5_100_000, adRevenueGold: 21_000, topupDiamond: 7_100, goldIssued: 58_000, goldSpent: 47_000, goldLiability: 1_191_000, greenEarned: 33_000, greenSpent: 25_000, greenExpired: 980, totalVotes: 108_000, voteGreen: 60_000, voteGold: 48_000, eventBonusCost: 4_100 },
      { metricDate: dateStr(-3), dau: 870, wau: 3_180, mau: 10_010, newUsers: 58, revenueVnd: 3_800_000, adRevenueGold: 16_500, topupDiamond: 5_900, goldIssued: 49_000, goldSpent: 44_000, goldLiability: 1_196_000, greenEarned: 28_500, greenSpent: 26_000, greenExpired: 1_500, totalVotes: 91_000, voteGreen: 51_000, voteGold: 40_000, eventBonusCost: 2_900 },
      { metricDate: dateStr(-2), dau: 960, wau: 3_360, mau: 10_140, newUsers: 83, revenueVnd: 6_400_000, adRevenueGold: 24_000, topupDiamond: 8_200, goldIssued: 64_000, goldSpent: 52_000, goldLiability: 1_208_000, greenEarned: 36_000, greenSpent: 29_000, greenExpired: 1_100, totalVotes: 120_000, voteGreen: 66_000, voteGold: 54_000, eventBonusCost: 4_800 },
      { metricDate: dateStr(-1), dau: 1_020, wau: 3_480, mau: 10_260, newUsers: 92, revenueVnd: 7_200_000, adRevenueGold: 27_500, topupDiamond: 9_000, goldIssued: 70_000, goldSpent: 55_000, goldLiability: 1_223_000, greenEarned: 39_000, greenSpent: 31_000, greenExpired: 900, totalVotes: 134_000, voteGreen: 73_000, voteGold: 61_000, eventBonusCost: 5_400 },
    ])
    .onConflictDoNothing();

  // 5) shipping_addresses (PII) + gift_wallet_items phủ mọi trạng thái cho trang Đơn hàng + ví quà
  // deal 0051 = DIGITAL voucher; deal 0053 = PHYSICAL lightstick
  const SHIP_ADDR_ID = '00000000-0000-4000-8000-000000000941';
  await db
    .insert(shippingAddresses)
    .values({ id: SHIP_ADDR_ID, userId: USER_ID, recipient: 'Trang Nguyễn', phone: '0901234567', line1: '123 Lê Lợi', ward: 'Phường Bến Nghé', district: 'Quận 1', province: 'TP. Hồ Chí Minh', note: 'Giao giờ hành chính' })
    .onConflictDoNothing();
  await db
    .insert(giftWalletItems)
    .values([
      // PHYSICAL CONFIRMED — admin đã xác nhận, chờ giao
      { id: '00000000-0000-4000-8000-000000000951', userId: USER_ID, dealId: '00000000-0000-4000-8000-000000000053', itemType: 'PHYSICAL', status: 'CONFIRMED', shippingAddressId: SHIP_ADDR_ID, confirmedAt: d(-3), expiresAt: d(57) },
      // PHYSICAL SHIPPED — đã gửi
      { id: '00000000-0000-4000-8000-000000000952', userId: USER_ID, dealId: '00000000-0000-4000-8000-000000000053', itemType: 'PHYSICAL', status: 'SHIPPED', shippingAddressId: SHIP_ADDR_ID, confirmedAt: d(-4), shippedAt: d(-2), expiresAt: d(56) },
      // PHYSICAL DELIVERED — đã giao thành công
      { id: '00000000-0000-4000-8000-000000000953', userId: USER_ID, dealId: '00000000-0000-4000-8000-000000000053', itemType: 'PHYSICAL', status: 'DELIVERED', shippingAddressId: SHIP_ADDR_ID, confirmedAt: d(-6), shippedAt: d(-4), deliveredAt: d(-1), expiresAt: d(54) },
      // DIGITAL USED — đã dùng mã
      { id: '00000000-0000-4000-8000-000000000954', userId: USER_ID, dealId: '00000000-0000-4000-8000-000000000051', itemType: 'DIGITAL', status: 'USED', code: 'HL50-USED-7K2', usedAt: d(-2), expiresAt: d(28) },
    ])
    .onConflictDoNothing();

  // 8) idol_follows — user demo theo dõi 2 idol (Vũ Cát Tường Lee, Trần Bảo Khôi)
  await db
    .insert(idolFollows)
    .values([
      { id: '00000000-0000-4000-8000-000000000971', userId: USER_ID, idolId: '00000000-0000-4000-8000-000000000011' },
      { id: '00000000-0000-4000-8000-000000000972', userId: USER_ID, idolId: '00000000-0000-4000-8000-000000000013' },
    ])
    .onConflictDoNothing();

  console.log('• seed kịch bản: 6 vote_log, 2 referral (1 REWARDED), 4 BXH PENDING, 5 daily_metrics, 1 địa chỉ + 4 đơn quà (CONFIRMED/SHIPPED/DELIVERED/USED), 1 idol REJECTED, 2 RESOLVED (A winner / C an ủi), +4 user (@referee1/@referee2/@chuaxacthuc/@flagged), 2 idol follow');
}

// Backfill cho hàng đã seed trước khi có cột username/prize (khi seedDemo/seedScenarios bị guard bỏ qua).
// Chỉ ghi khi cột còn NULL → an toàn chạy lại, không đè giá trị do người dùng đặt.
const USERNAME_BACKFILL: Array<{ id: string; username: string }> = [
  { id: ADMIN_ID, username: 'admin' },
  { id: USER_ID, username: 'trang' },
  { id: REFEREE_REWARDED_ID, username: 'referee1' },
  { id: REFEREE_PENDING_ID, username: 'referee2' },
  { id: UNVERIFIED_USER_ID, username: 'chuaxacthuc' },
  { id: FLAGGED_USER_ID, username: 'flagged' },
];
const PRIZE_BACKFILL: Array<{ id: string; prize: string }> = [
  { id: CAMPAIGN_ID, prize: 'Billboard LED Times Square HCM 1 tuần + bộ ảnh concept' },
  { id: CAMP_OPEN2, prize: 'Suất biểu diễn mở màn liveshow + bộ ảnh concept' },
];

async function backfillUsernamesAndPrize(): Promise<void> {
  for (const u of USERNAME_BACKFILL) {
    await db.update(users).set({ username: u.username }).where(and(eq(users.id, u.id), isNull(users.username)));
  }
  for (const c of PRIZE_BACKFILL) {
    await db.update(campaigns).set({ prize: c.prize }).where(and(eq(campaigns.id, c.id), isNull(campaigns.prize)));
  }
  console.log('• backfill: username (6 user) + prize (2 campaign OPEN) khi NULL');
}

// Campaign "Sắp tới" = DRAFT + open_at tương lai (trang Sự kiện lọc theo điều kiện này).
// Idempotent + KHÔNG guard để `db:seed` luôn bổ sung kể cả DB đã seed trước đó.
async function seedUpcomingCampaigns(): Promise<void> {
  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 86400000);
  await db
    .insert(campaigns)
    .values([
      { id: '00000000-0000-4000-8000-0000000009c1', title: 'Giọng Ca Mùa Thu 2026', description: 'Sắp diễn ra — bình chọn giọng ca mùa thu.', starGoal: 1_500_000, donationRatioBps: 5000, prize: 'Quay MV độc quyền + suất diễn fanmeeting', status: 'DRAFT', openAt: d(3), createdBy: ADMIN_ID },
      { id: '00000000-0000-4000-8000-0000000009c2', title: 'Đại Hội Fandom Cuối Năm', description: 'Sắp diễn ra — sự kiện lớn cuối năm.', starGoal: 3_000_000, donationRatioBps: 5000, prize: 'Billboard LED Hà Nội 1 tuần', status: 'DRAFT', openAt: d(10), createdBy: ADMIN_ID },
      { id: '00000000-0000-4000-8000-0000000009c3', title: 'Tân Binh Tỏa Sáng Q4', description: 'Sắp diễn ra — sân chơi cho tân binh.', starGoal: 800_000, donationRatioBps: 4000, prize: 'Hợp đồng đào tạo 6 tháng', status: 'DRAFT', openAt: d(14), createdBy: ADMIN_ID },
      { id: '00000000-0000-4000-8000-0000000009c4', title: 'Cúp Bình Chọn Mùa Xuân 2027', description: 'Sắp diễn ra — khởi tranh mùa giải mới.', starGoal: 2_000_000, donationRatioBps: 5000, prize: 'Bộ ảnh concept + cặp vé concert', status: 'DRAFT', openAt: d(21), createdBy: ADMIN_ID },
    ])
    .onConflictDoNothing();
  // CAMP_DRAFT cũ chưa có open_at → set tương lai để hiện ở "Sắp tới".
  await db.update(campaigns).set({ openAt: d(7) }).where(and(eq(campaigns.id, CAMP_DRAFT), isNull(campaigns.openAt)));
  console.log('• seed sắp diễn ra: 4 campaign DRAFT (open_at tương lai) + open_at cho CAMP_DRAFT');
}

// ===== Danh mục shop + sự kiện (offer wall, gói IAP, point events) =====
// Seed VÔ ĐIỀU KIỆN + idempotent (onConflictDoNothing): guard của seedDemo bỏ qua khi DB
// đã có demo, nên data thêm về sau (offer/iap/6 events) không vào được → luôn bổ sung ở đây.
async function seedCatalog(): Promise<void> {
  const now = new Date();
  const at = (days: number) => new Date(now.getTime() + days * 86400000);

  await db
    .insert(offerTasks)
    .values([
      { id: '00000000-0000-4000-8000-000000000061', title: 'Xem video 30 giây', icon: '🎬', iconBg: '#FB7185', rewardGold: 20, sortOrder: 1 },
      { id: '00000000-0000-4000-8000-000000000062', title: 'Hoàn thành khảo sát', icon: '📝', iconBg: '#3B82F6', rewardGold: 50, sortOrder: 2 },
      { id: '00000000-0000-4000-8000-000000000063', title: 'Mời bạn bè', icon: '👥', iconBg: '#22C55E', rewardGold: 100, sortOrder: 3 },
      { id: '00000000-0000-4000-8000-000000000064', title: 'Theo dõi fanpage', icon: '❤️', iconBg: '#FFD60A', rewardGold: 15, sortOrder: 4 },
    ])
    .onConflictDoNothing();

  await db
    .insert(iapPackages)
    .values([
      { id: '00000000-0000-4000-8000-000000000071', sku: 'dia_100', title: '100 Diamond', diamondAmount: 100, bonusDiamond: 0, priceVnd: 10000 },
      { id: '00000000-0000-4000-8000-000000000072', sku: 'dia_550', title: '550 Diamond', diamondAmount: 500, bonusDiamond: 50, priceVnd: 50000 },
      { id: '00000000-0000-4000-8000-000000000073', sku: 'dia_1200', title: '1.200 Diamond', diamondAmount: 1200, bonusDiamond: 0, priceVnd: 100000 },
      { id: '00000000-0000-4000-8000-000000000074', sku: 'dia_6500', title: '6.500 Diamond', diamondAmount: 5000, bonusDiamond: 1500, priceVnd: 500000 },
    ])
    .onConflictDoNothing();

  // ongoing/upcoming/past cho trang Sự kiện; b1 ongoing → banner ×2 GOLD ở Shop hiển thị.
  await db
    .insert(pointEvents)
    .values([
      { id: '00000000-0000-4000-8000-0000000009b1', title: '×2 Gold cuối tuần', type: 'EARN_MULTIPLIER', targetCurrency: 'GOLD', multiplierBps: 20000, priority: 8, startsAt: at(-2), endsAt: at(2), bannerText: 'Nhân đôi Gold mọi nhiệm vụ cuối tuần!', isActive: true },
      { id: '00000000-0000-4000-8000-0000000009b2', title: 'Nạp Diamond +50%', type: 'TOPUP_MULTIPLIER', targetCurrency: 'DIAMOND', multiplierBps: 15000, priority: 7, startsAt: at(-1), endsAt: at(4), bannerText: 'Nạp Diamond nhận thêm 50% giá trị.', isActive: true },
      { id: '00000000-0000-4000-8000-0000000009b3', title: '×3 Green ngày lễ', type: 'EARN_MULTIPLIER', targetCurrency: 'GREEN', multiplierBps: 30000, priority: 9, startsAt: at(5), endsAt: at(7), bannerText: 'Sắp tới: nhân ba Green dịp lễ!', isActive: true },
      { id: '00000000-0000-4000-8000-0000000009b4', title: 'Nạp Diamond +100% Tết', type: 'TOPUP_MULTIPLIER', targetCurrency: 'DIAMOND', multiplierBps: 30000, priority: 9, startsAt: at(10), endsAt: at(14), bannerText: 'Tết về: nạp Diamond x2 giá trị!', isActive: true },
      { id: '00000000-0000-4000-8000-0000000009b5', title: '×2 Gold tháng trước', type: 'EARN_MULTIPLIER', targetCurrency: 'GOLD', multiplierBps: 20000, priority: 5, startsAt: at(-40), endsAt: at(-10), bannerText: 'Sự kiện đã kết thúc.', isActive: false },
      { id: '00000000-0000-4000-8000-0000000009b6', title: 'Nạp Diamond +50% hè rồi', type: 'TOPUP_MULTIPLIER', targetCurrency: 'DIAMOND', multiplierBps: 15000, priority: 4, startsAt: at(-30), endsAt: at(-8), bannerText: 'Sự kiện đã kết thúc.', isActive: false },
    ])
    .onConflictDoNothing();

  console.log('• seed danh mục: 4 offer + 4 iap + 6 point_events (ongoing/upcoming/past)');
}

// Init-once (kiểu open-source): chỉ seed khi DB CHƯA khởi tạo (bảng platform_config trống).
// Đã khởi tạo → bỏ qua toàn bộ. Ép seed lại (áp data thêm về sau) bằng SEED_FORCE=true / --force.
async function main(): Promise<void> {
  const force = process.env.SEED_FORCE === 'true' || process.argv.includes('--force');
  const initialized = (await db.select({ k: platformConfig.key }).from(platformConfig).limit(1)).length > 0;
  if (initialized && !force) {
    console.log('• DB đã khởi tạo → bỏ qua seed. (SEED_FORCE=true để seed lại data mới.)');
    await pool.end();
    return;
  }

  await seedConfig();
  await seedCatalog();
  await seedDemo();
  await seedMore();
  await seedScenarios();
  await seedUpcomingCampaigns();
  await backfillUsernamesAndPrize();
  console.log(force ? '✓ seed hoàn tất (FORCE — bổ sung data mới)' : '✓ seed hoàn tất (khởi tạo lần đầu)');
  await pool.end();
}

main().catch((err) => {
  console.error('seed failed', err);
  process.exit(1);
});
