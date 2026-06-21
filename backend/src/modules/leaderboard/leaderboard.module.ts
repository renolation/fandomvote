import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { WalletModule } from '../wallet/wallet.module';
import { LeaderboardAdminController } from './leaderboard-admin.controller';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

@Module({
  imports: [WalletModule, NotificationModule],
  controllers: [LeaderboardController, LeaderboardAdminController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
