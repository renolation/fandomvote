import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ReferralModule } from '../referral/referral.module';
import { WalletModule } from '../wallet/wallet.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [WalletModule, EventsModule, ReferralModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
