import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { DrizzleModule } from './db/drizzle.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PlatformConfigModule } from './modules/platform-config/platform-config.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ReferralModule } from './modules/referral/referral.module';
import { IdolModule } from './modules/idol/idol.module';
import { FollowModule } from './modules/follow/follow.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { VoteModule } from './modules/vote/vote.module';
import { ShopModule } from './modules/shop/shop.module';
import { EventsModule } from './modules/events/events.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { NotificationModule } from './modules/notification/notification.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { ScheduledModule } from './modules/scheduled/scheduled.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule, // global @nestjs/config
    JwtModule.register({}), // cho global JwtAuthGuard
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DrizzleModule,
    // hạ tầng dùng chung (global)
    PlatformConfigModule,
    IdempotencyModule,
    AuditModule,
    // feature modules
    AuthModule,
    WalletModule,
    ReferralModule,
    IdolModule,
    FollowModule,
    CampaignModule,
    VoteModule,
    ShopModule,
    EventsModule,
    WebhookModule,
    NotificationModule,
    LeaderboardModule,
    AnalyticsModule,
    AdminModule,
    ScheduledModule,
    UploadModule,
  ],
  providers: [
    // thứ tự: throttle → xác thực JWT (gắn user) → kiểm tra role
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
