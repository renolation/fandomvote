import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { ResolutionService } from './resolution.service';

@Module({
  imports: [NotificationModule],
  controllers: [CampaignController],
  providers: [CampaignService, ResolutionService],
  exports: [CampaignService, ResolutionService],
})
export class CampaignModule {}
