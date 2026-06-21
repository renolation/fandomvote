import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CampaignModule } from '../campaign/campaign.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { ScheduledTasksService } from './scheduled-tasks.service';

@Module({
  imports: [CampaignModule, LeaderboardModule, AnalyticsModule],
  providers: [ScheduledTasksService],
})
export class ScheduledModule {}
