import { Module } from '@nestjs/common';
import { CampaignModule } from '../campaign/campaign.module';
import { ScheduledTasksService } from './scheduled-tasks.service';

@Module({
  imports: [CampaignModule],
  providers: [ScheduledTasksService],
})
export class ScheduledModule {}
