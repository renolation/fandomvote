import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { WalletModule } from '../wallet/wallet.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [WalletModule, EventsModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
