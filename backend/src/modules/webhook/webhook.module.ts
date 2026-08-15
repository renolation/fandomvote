import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ReferralModule } from '../referral/referral.module';
import { ShopModule } from '../shop/shop.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdmobSsvService } from './admob-ssv.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [WalletModule, EventsModule, ReferralModule, ShopModule],
  controllers: [WebhookController],
  providers: [WebhookService, AdmobSsvService],
})
export class WebhookModule {}
