import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CampaignService } from '../campaign/campaign.service';
import { ResolutionService } from '../campaign/resolution.service';
import { CreateCampaignDto, UpdateCampaignDto } from '../campaign/dto/create-campaign.dto';
import { IdolService } from '../idol/idol.service';
import { UserService } from '../user/user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { VoteService } from '../vote/vote.service';
import { GiftWalletService } from '../shop/gift-wallet.service';
import { ReconcileService } from '../reconcile/reconcile.service';
import { AdminDeleteService } from './admin-delete.service';

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
    private readonly adminDelete: AdminDeleteService,
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

  @Post('users/:id/update')
  @ApiOperation({ summary: 'Sửa thông tin user (tên/fandom/role)' })
  updateUser(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.user.update(admin.id, id, dto);
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

  @Post('campaigns/:id/update')
  @ApiOperation({ summary: 'Sửa campaign (mọi trạng thái — DEV)' })
  updateCampaign(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaign.update(admin.id, id, dto);
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

  // ===== Hard-delete (cascade) — DEV: admin xóa cứng mọi entity =====

  @Post('users/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng user + toàn bộ dữ liệu liên quan' })
  deleteUser(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminDelete.deleteUser(admin.id, id);
  }

  @Post('campaigns/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng campaign + vote/biên lai/snapshot' })
  deleteCampaign(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminDelete.deleteCampaign(admin.id, id);
  }

  @Post('idols/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng idol + campaign_idol/vote/follow liên quan' })
  deleteIdol(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminDelete.deleteIdol(admin.id, id);
  }

  @Post('deals/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng shop deal + gift item đã đổi' })
  deleteDeal(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminDelete.deleteDeal(admin.id, id);
  }

  @Post('offers/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng offer task' })
  deleteOffer(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminDelete.deleteOffer(admin.id, id);
  }

  @Post('iap-packages/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng gói IAP' })
  deleteIapPackage(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminDelete.deleteIapPackage(admin.id, id);
  }

  @Post('point-events/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng sự kiện điểm' })
  deletePointEvent(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminDelete.deletePointEvent(admin.id, id);
  }

  @Post('gifts/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng quà trong ví' })
  deleteGiftItem(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminDelete.deleteGiftItem(admin.id, id);
  }

  @Post('notifications/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng thông báo' })
  deleteNotification(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminDelete.deleteNotification(admin.id, id);
  }

  @Post('leaderboard-snapshots/:id/delete')
  @ApiOperation({ summary: 'Xóa cứng snapshot bảng xếp hạng' })
  deleteLeaderboardSnapshot(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminDelete.deleteLeaderboardSnapshot(admin.id, id);
  }
}
