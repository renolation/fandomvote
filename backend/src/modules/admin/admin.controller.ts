import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CampaignService } from '../campaign/campaign.service';
import { ResolutionService } from '../campaign/resolution.service';
import { CreateCampaignDto } from '../campaign/dto/create-campaign.dto';
import { IdolService } from '../idol/idol.service';
import { UserService } from '../user/user.service';
import { VoteService } from '../vote/vote.service';
import { GiftWalletService } from '../shop/gift-wallet.service';
import { ReconcileService } from '../reconcile/reconcile.service';

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
    private readonly user: UserService,
    private readonly giftWallet: GiftWalletService,
    private readonly reconcile: ReconcileService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Liệt kê user (search + lọc flagged, cursor)' })
  listUsers(
    @Query('search') search: string | undefined,
    @Query('flagged') flagged: string | undefined,
    @Query() q: PaginationQueryDto,
  ) {
    return this.user.listForAdmin({ ...q, search, flagged });
  }

  @Post('users/:id/flag')
  @ApiOperation({ summary: 'Gắn cờ gian lận user' })
  flagUser(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.user.setFlagged(admin.id, id, true);
  }

  @Post('users/:id/unflag')
  @ApiOperation({ summary: 'Bỏ cờ gian lận user' })
  unflagUser(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.user.setFlagged(admin.id, id, false);
  }

  @Get('idols')
  @ApiOperation({ summary: 'Liệt kê idol theo trạng thái (mặc định PENDING)' })
  listIdols(
    @Query('status') status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING',
    @Query() q: PaginationQueryDto,
  ) {
    return this.idol.listByStatus(status, q);
  }

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

  // ===== Đơn hàng quà PHYSICAL =====

  @Get('orders')
  @ApiOperation({ summary: 'Liệt kê đơn quà PHYSICAL (mặc định ALL)' })
  listOrders(@Query('status') status?: string) {
    return this.giftWallet.listOrders(status);
  }

  @Post('orders/:id/ship')
  @ApiOperation({ summary: 'Giao đơn (CONFIRMED→SHIPPED)' })
  shipOrder(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.giftWallet.markShipped(admin.id, id);
  }

  @Post('orders/:id/deliver')
  @ApiOperation({ summary: 'Hoàn tất đơn (SHIPPED→DELIVERED)' })
  deliverOrder(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.giftWallet.markDelivered(admin.id, id);
  }

  // ===== Đối soát tiền (READ-ONLY) =====

  @Get('reconcile/summary')
  @ApiOperation({ summary: 'Tổng quan đối soát tiền' })
  reconcileSummary() {
    return this.reconcile.summary();
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Liệt kê wallet_ledger (keyset id desc)' })
  listLedger(
    @Query('source') source: string | undefined,
    @Query('userId') userId: string | undefined,
    @Query('cursor') cursor: string | undefined,
    @Query('limit') limit: string | undefined,
  ) {
    return this.reconcile.listLedger({
      source,
      userId,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
