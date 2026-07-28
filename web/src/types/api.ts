// Type khớp contract backend FDV (xem backend.CLAUDE.md §12 + OpenAPI /api/docs).
// Hand-write để type-check không cần codegen; khi cần có thể thay bằng client sinh từ OpenAPI.

export type Currency = 'GREEN' | 'GOLD' | 'DIAMOND';
export type Role = 'USER' | 'ADMIN';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export type LedgerSource =
  | 'CHECKIN'
  | 'EVENT_BONUS'
  | 'REFERRAL'
  | 'VIDEO'
  | 'TASK'
  | 'OFFERWALL'
  | 'IAP_DIAMOND'
  | 'DIAMOND_TO_GOLD'
  | 'VOTE'
  | 'VOTE_REVERSAL'
  | 'PURCHASE'
  | 'OFFERWALL_CHARGEBACK'
  | 'ADMIN_ADJUST'
  | 'REWARD';

export type CampaignStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'CLOSED'
  | 'RESOLVING'
  | 'RESOLVED'
  | 'ARCHIVED';

export type IdolStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type GiftItemType = 'DIGITAL' | 'PHYSICAL';
export type GiftItemStatus =
  | 'ACTIVE'
  | 'USED'
  | 'EXPIRED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED';
export type PointEventType = 'EARN_MULTIPLIER' | 'TOPUP_MULTIPLIER';
export type NotificationType =
  | 'SYSTEM'
  | 'VOTE'
  | 'CAMPAIGN'
  | 'REFERRAL'
  | 'SHOP'
  | 'RESOLUTION';
export type VerificationChannel = 'EMAIL' | 'PHONE';

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  authProvider: AuthProvider;
  googleSub: string | null;
  displayName: string;
  fandom: string | null;
  avatarUrl: string | null;
  role: Role;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
export interface AuthResult extends TokenPair {
  user: AuthUser;
}

export interface Balances {
  green: number;
  gold: number;
  diamond: number;
}

export interface WalletLedgerRow {
  id: number;
  userId: string;
  currency: Currency;
  amount: number;
  source: LedgerSource;
  expiresAt: string | null;
  realValueVnd: number;
  refType: string | null;
  refId: string | null;
  consumesLedgerId: number | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export interface VoteResult {
  campaignIdolId: string;
  amount: number;
  greenSpent: number;
  goldSpent: number;
  newTotal: number;
  balance: Balances;
}

export interface VoteLog {
  id: number;
  userId: string;
  campaignIdolId: string;
  campaignId: string;
  currency: Currency;
  amount: number;
  realValueVnd: number;
  runningTotal: number;
  isReversal: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  rulesContent: string | null;
  prize: string | null;
  starGoal: number;
  donationRatioBps: number;
  status: CampaignStatus;
  openAt: string | null;
  closeAt: string | null;
  closedAt: string | null;
  snapshottedAt: string | null;
  resolvedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  campaignIdolId: string;
  idolId: string;
  name: string;
  avatarUrl: string | null;
  totalVotes: number;
  reachedValueAt: string | null;
}

export interface CampaignSnapshotRow {
  id: number;
  campaignId: string;
  campaignIdolId: string;
  idolId: string;
  rank: number;
  totalVotes: number;
  reachedValueAt: string | null;
  snapshottedAt: string;
}

// Biên lai PER-USER (mỗi voter Gold 1 dòng) — §6.
export interface DonationReceipt {
  id: string;
  campaignId: string;
  userId: string;
  goldVoted: number;
  donatedVnd: number;
  donationRatioBps: number;
  receiptNo: string;
  createdAt: string;
}

export interface CampaignResult {
  campaign: Campaign;
  snapshot: CampaignSnapshotRow[];
  fundVnd: number; // tổng quỹ = Σ donatedVnd per-user
  receiptsCount: number;
}

export interface CampaignIdol {
  id: string;
  campaignId: string;
  idolId: string;
  totalVotes: number;
  reachedValueAt: string | null;
  addedBy: string | null;
  createdAt: string;
}

export interface Idol {
  id: string;
  name: string;
  nameNormalized: string;
  aliases: string[] | null;
  avatarUrl: string | null;
  bio: string | null;
  status: IdolStatus;
  nominatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateCheck {
  duplicate: boolean;
  idol?: Idol;
}

export interface ReferralStats {
  referralCode: string;
  totalInvited: number;
  totalRewarded: number;
}

export interface ShopDeal {
  id: string;
  title: string;
  description: string | null;
  partnerId: string | null;
  cost: number;
  currency: Currency;
  itemType: GiftItemType;
  stock: number;
  stockSold: number;
  validityDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GiftWalletItem {
  id: string;
  userId: string;
  dealId: string;
  itemType: GiftItemType;
  status: GiftItemStatus;
  code: string | null;
  expiresAt: string | null;
  shippingAddressId: string | null;
  usedAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface RedeemResult {
  giftItem: GiftWalletItem;
  balance: Balances;
}

export interface ShippingAddress {
  id: string;
  userId: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string | null;
  ward: string | null;
  district: string | null;
  province: string;
  note: string | null;
  createdAt: string;
}

export interface DailyRewardConfig {
  id: string;
  dayIndex: number;
  greenAmount: number;
  isActive: boolean;
  createdAt: string;
}

// Offer wall LIVE (Lootably) — đã chuẩn hoá từ backend để hiển thị.
export interface LiveOffer {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  actionUrl: string;
  rewardGold: number;
  icon?: string | null;
  iconBg?: string | null;
}

export interface OfferTask {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  iconBg: string | null;
  rewardGold: number;
  provider: string;
  actionUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface IapPackage {
  id: string;
  sku: string;
  title: string;
  diamondAmount: number;
  bonusDiamond: number;
  priceVnd: number;
  platform: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PointEvent {
  id: string;
  title: string;
  type: PointEventType;
  multiplierBps: number;
  priority: number;
  startsAt: string;
  endsAt: string;
  maxBonusPerUser: number | null;
  maxBonusTotal: number | null;
  bonusTotalUsed: number;
  isActive: boolean;
  createdAt: string;
  bannerText?: string | null;
  bannerImage?: string | null;
  targetCurrency?: Currency;
  appliesToSources?: LedgerSource[] | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

// ---- User leaderboards (§17) ----
export type LeaderboardType = 'TOP_VOTER' | 'TOP_EARNER';
export type LeaderboardPeriod = 'DAY' | 'WEEK' | 'MONTH';
export interface BoardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
}
export interface IdolBoardEntry {
  rank: number;
  idolId: string;
  name: string;
  score: number;
}
export interface MyRank {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  rank: number | null;
  score: number;
}
export interface LeaderboardSnapshot {
  id: number;
  boardType: LeaderboardType;
  period: LeaderboardPeriod;
  periodStart: string;
  periodEnd: string;
  userId: string;
  rank: number;
  score: number;
  rewardStatus: 'PENDING' | 'APPROVED' | 'SENT';
  rewardConfig: Record<string, unknown> | null;
  grantedAt: string | null;
  createdAt: string;
}

// ---- Analytics (§18) ----
export interface DailyMetric {
  metricDate: string;
  dau: number;
  wau: number;
  mau: number;
  newUsers: number;
  revenueVnd: number;
  adRevenueGold: number;
  topupDiamond: number;
  goldIssued: number;
  goldSpent: number;
  goldLiability: number;
  greenEarned: number;
  greenSpent: number;
  greenExpired: number;
  totalVotes: number;
  voteGreen: number;
  voteGold: number;
  eventBonusCost: number;
  computedAt: string;
}
export interface AnalyticsOverview {
  currencyHealth: {
    goldLiability: number;
    goldSinkSource: number;
    greenSinkSource: number;
    totalFundVnd: number;
    inflationWarning: boolean;
  };
  recent: DailyMetric[];
}

// ---- Admin orders (physical gift fulfilment §) ----
// Thao tác trên gift_wallet_items có item_type='PHYSICAL'.
export interface AdminOrder {
  id: string;
  status: GiftItemStatus;
  dealTitle: string | null;
  code: string | null;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  user: { id: string; displayName: string; email: string | null };
  address: {
    recipient: string;
    phone: string;
    line1: string;
    line2: string | null;
    ward: string | null;
    district: string | null;
    province: string;
    note: string | null;
  } | null;
}

// ---- Admin reconcile (đối soát tiền — READ-ONLY trên wallet_ledger) ----
export interface SourceBreakdown {
  source: string;
  credited: number;
  debited: number;
  realValueVnd: number;
  count: number;
}
export interface ReconcileSummary {
  iapRevenueVnd: number;
  offerwallGoldIssued: number;
  donationFundVnd: number;
  flaggedUsers: number;
  negativeGoldUsers: number;
  bySource: SourceBreakdown[];
}
export interface AdminLedgerRow {
  id: number;
  userId: string;
  userName: string | null;
  currency: Currency;
  amount: number;
  source: string;
  realValueVnd: number;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}

// ---- Admin user management ----
export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  displayName: string;
  fandom: string | null;
  avatarUrl: string | null;
  role: Role;
  authProvider: AuthProvider;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  isFlagged: boolean;
  createdAt: string;
}

// ---- Request bodies ----
export interface RegisterBody {
  email?: string;
  phone?: string;
  password: string;
  displayName: string;
  referralCode?: string;
  deviceFingerprint?: string;
}
export interface LoginBody {
  email?: string;
  phone?: string;
  password: string;
}
export interface GoogleAuthBody {
  idToken: string;
  referralCode?: string;
  deviceFingerprint?: string;
}
export interface ConvertDiamondBody {
  diamonds: number;
}
export interface CastVoteBody {
  campaignIdolId: string;
  amount: number;
}
export interface NominateIdolBody {
  name: string;
  aliases?: string[];
  avatarUrl?: string;
  bio?: string;
}
export interface CreateCampaignBody {
  title: string;
  description?: string;
  rulesContent?: string;
  prize?: string;
  starGoal: number;
  donationRatioBps?: number;
  openAt?: string;
  closeAt?: string;
}
export interface UpdateCampaignBody {
  title?: string;
  description?: string;
  rulesContent?: string;
  prize?: string;
  starGoal?: number;
  donationRatioBps?: number;
  openAt?: string | null;
  closeAt?: string | null;
}
// Deal chỉ dùng GOLD | DIAMOND (GREEN không đổi quà).
export type DealCurrency = 'GOLD' | 'DIAMOND';

export interface CreateDealBody {
  title: string;
  description?: string;
  partnerId?: string;
  cost: number;
  currency: DealCurrency;
  itemType: GiftItemType;
  stock: number;
  validityDays?: number;
  isActive?: boolean;
}

export type UpdateDealBody = Partial<CreateDealBody>;

export interface UpdateProfileBody {
  avatarUrl?: string;
  displayName?: string;
  fandom?: string;
}
export interface UpdateUserBody {
  displayName?: string;
  fandom?: string;
  role?: Role;
}
export interface CreateAddressBody {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  ward?: string;
  district?: string;
  province: string;
  note?: string;
}
