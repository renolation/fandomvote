import { Module } from '@nestjs/common';
import { CampaignModule } from '../campaign/campaign.module';
import { IdolModule } from '../idol/idol.module';
import { VoteModule } from '../vote/vote.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [IdolModule, CampaignModule, VoteModule],
  controllers: [AdminController],
})
export class AdminModule {}
