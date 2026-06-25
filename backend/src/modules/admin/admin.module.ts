import { Module } from '@nestjs/common';
import { CampaignModule } from '../campaign/campaign.module';
import { IdolModule } from '../idol/idol.module';
import { UserModule } from '../user/user.module';
import { VoteModule } from '../vote/vote.module';
import { ShopModule } from '../shop/shop.module';
import { ReconcileModule } from '../reconcile/reconcile.module';
import { AdminController } from './admin.controller';
import { AdminDeleteService } from './admin-delete.service';

@Module({
  imports: [IdolModule, CampaignModule, VoteModule, UserModule, ShopModule, ReconcileModule],
  controllers: [AdminController],
  providers: [AdminDeleteService],
})
export class AdminModule {}
