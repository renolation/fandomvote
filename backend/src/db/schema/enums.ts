import { pgEnum } from 'drizzle-orm/pg-core';

// 3 loại tiền tệ — §4
export const currencyEnum = pgEnum('currency', ['GREEN', 'GOLD', 'DIAMOND']);

// Nguồn mỗi dòng ledger. Append-only — không bao giờ sửa dòng cũ.
export const ledgerSourceEnum = pgEnum('ledger_source', [
  'CHECKIN',
  'EVENT_BONUS',
  'REFERRAL',
  'VIDEO',
  'TASK',
  'OFFERWALL',
  'IAP_DIAMOND',
  'DIAMOND_TO_GOLD',
  'VOTE',
  'VOTE_REVERSAL',
  'PURCHASE',
  'OFFERWALL_CHARGEBACK',
  'ADMIN_ADJUST',
  'REWARD', // thưởng leaderboard (Top Voter/Earner)
]);

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);
export const authProviderEnum = pgEnum('auth_provider', ['LOCAL', 'GOOGLE']);

export const idolStatusEnum = pgEnum('idol_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'DRAFT',
  'OPEN',
  'CLOSED',
  'RESOLVING',
  'RESOLVED',
  'ARCHIVED',
]);

export const idempotencyStatusEnum = pgEnum('idempotency_status', ['PENDING', 'DONE']);
export const referralStatusEnum = pgEnum('referral_status', ['PENDING', 'REWARDED']);

export const giftItemTypeEnum = pgEnum('gift_item_type', ['DIGITAL', 'PHYSICAL']);
// DIGITAL: ACTIVE→USED→EXPIRED. PHYSICAL: PENDING→CONFIRMED→SHIPPED→DELIVERED→EXPIRED.
export const giftItemStatusEnum = pgEnum('gift_item_status', [
  'ACTIVE',
  'USED',
  'EXPIRED',
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
]);

export const pointEventTypeEnum = pgEnum('point_event_type', [
  'EARN_MULTIPLIER',
  'TOPUP_MULTIPLIER',
]);
export const pointEventTargetEnum = pgEnum('point_event_target', ['GOLD', 'DIAMOND', 'GREEN', 'ALL']);

// User leaderboards — §17
export const leaderboardTypeEnum = pgEnum('leaderboard_type', ['TOP_VOTER', 'TOP_EARNER']);
export const leaderboardPeriodEnum = pgEnum('leaderboard_period', ['DAY', 'WEEK', 'MONTH']);
export const rewardStatusEnum = pgEnum('reward_status', ['PENDING', 'APPROVED', 'SENT']);

export const verificationChannelEnum = pgEnum('verification_channel', ['EMAIL', 'PHONE']);
export const verificationPurposeEnum = pgEnum('verification_purpose', [
  'VERIFY_EMAIL',
  'VERIFY_PHONE',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'SYSTEM',
  'VOTE',
  'CAMPAIGN',
  'REFERRAL',
  'SHOP',
  'RESOLUTION',
]);
