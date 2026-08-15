import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ReferralModule } from '../referral/referral.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdRewardService } from './ad-reward.service';
import { DailyRewardService } from './daily-reward.service';
import { GiftWalletService } from './gift-wallet.service';
import { LootablyService } from './lootably.service';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

@Module({
  imports: [WalletModule, EventsModule, ReferralModule],
  controllers: [ShopController],
  providers: [ShopService, DailyRewardService, GiftWalletService, LootablyService, AdRewardService],
  exports: [ShopService, GiftWalletService, AdRewardService],
})
export class ShopModule {}
