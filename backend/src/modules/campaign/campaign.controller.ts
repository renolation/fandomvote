import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Campaign } from '../../db/schema';
import { AddIdolDto } from './dto/create-campaign.dto';
import { CampaignService } from './campaign.service';

@ApiTags('campaign')
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaign: CampaignService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Danh sách campaign (lọc theo status)' })
  list(@Query('status') status?: Campaign['status']) {
    return this.campaign.list(status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết campaign (gồm rules_content)' })
  get(@Param('id') id: string) {
    return this.campaign.getById(id);
  }

  @Public()
  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Bảng xếp hạng (poll 5–10s)' })
  leaderboard(@Param('id') id: string) {
    return this.campaign.getLeaderboard(id);
  }

  @Public()
  @Get(':id/result')
  @ApiOperation({ summary: 'Kết quả + tổng quỹ (sau RESOLVED)' })
  result(@Param('id') id: string) {
    return this.campaign.getResult(id);
  }

  @ApiBearerAuth()
  @Get(':id/receipt')
  @ApiOperation({ summary: 'Biên lai quyên góp của chính tôi (per-user)' })
  myReceipt(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaign.getMyReceipt(id, user.id);
  }

  @ApiBearerAuth()
  @Post(':id/idols')
  @ApiOperation({ summary: 'Đưa idol đã duyệt vào campaign (user tự do)' })
  addIdol(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddIdolDto) {
    return this.campaign.addIdolToCampaign(user.id, id, dto.idolId);
  }
}
