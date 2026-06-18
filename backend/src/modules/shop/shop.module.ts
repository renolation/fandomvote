import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { DailyRewardService } from './daily-reward.service';
import { GiftWalletService } from './gift-wallet.service';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

@Module({
  imports: [WalletModule],
  controllers: [ShopController],
  providers: [ShopService, DailyRewardService, GiftWalletService],
  exports: [ShopService, GiftWalletService],
})
export class ShopModule {}
