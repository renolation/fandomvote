import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CampaignService } from '../campaign/campaign.service';
import { ResolutionService } from '../campaign/resolution.service';
import { CreateCampaignDto } from '../campaign/dto/create-campaign.dto';
import { IdolService } from '../idol/idol.service';
import { VoteService } from '../vote/vote.service';

// Gom hành động admin + RolesGuard('ADMIN') — §3/§11. Mọi mutation ghi admin_audit_log trong service.
@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly idol: IdolService,
    private readonly campaign: CampaignService,
    private readonly resolution: ResolutionService,
    private readonly vote: VoteService,
  ) {}

  @Post('idols/:id/approve')
  @ApiOperation({ summary: 'Duyệt idol' })
  approveIdol(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.idol.setStatus(admin.id, id, 'APPROVED');
  }

  @Post('idols/:id/reject')
  @ApiOperation({ summary: 'Từ chối idol' })
  rejectIdol(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.idol.setStatus(admin.id, id, 'REJECTED');
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Tạo campaign (DRAFT)' })
  createCampaign(@CurrentUser() admin: AuthUser, @Body() dto: CreateCampaignDto) {
    return this.campaign.create(admin.id, dto);
  }

  @Post('campaigns/:id/open')
  @ApiOperation({ summary: 'Mở campaign (DRAFT→OPEN)' })
  openCampaign(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.campaign.open(admin.id, id);
  }

  @Post('campaigns/:id/close')
  @ApiOperation({ summary: 'Đóng campaign thủ công + snapshot' })
  async closeCampaign(@Param('id') id: string) {
    return { closed: await this.campaign.close(id) };
  }

  @Post('campaigns/:id/resolve')
  @ApiOperation({ summary: 'Chạy resolution (A/B/C, quỹ, biên lai)' })
  resolveCampaign(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.resolution.resolve(admin.id, id);
  }

  @Post('campaigns/:id/reverse-votes')
  @ApiOperation({ summary: 'Hủy campaign → hoàn vote (Gold→Gold, Green→Green mới)' })
  reverseVotes(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.vote.reverseCampaignVotes(admin.id, id);
  }
}
