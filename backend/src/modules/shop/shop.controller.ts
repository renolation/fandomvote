import { Body, Controller, Get, Headers, Ip, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AdRewardService } from './ad-reward.service';
import { DailyRewardService } from './daily-reward.service';
import { GiftWalletService } from './gift-wallet.service';
import { ShopService } from './shop.service';
import { ConfirmPhysicalDto, CreateAddressDto } from './dto/shop.dto';

@ApiTags('shop')
@ApiBearerAuth()
@Controller('shop')
export class ShopController {
  constructor(
    private readonly shop: ShopService,
    private readonly dailyReward: DailyRewardService,
    private readonly gift: GiftWalletService,
    private readonly adReward: AdRewardService,
  ) {}

  @Get('ads/status')
  @ApiOperation({ summary: 'Xem quảng cáo nhận Gold: cấu hình + hạn mức còn lại hôm nay' })
  adStatus(@CurrentUser() user: AuthUser) {
    return this.adReward.status(user.id);
  }

  @Post('ads/reward')
  @ApiOperation({ summary: 'Xem xong rewarded ad → cộng Gold (số Gold do server tính; chưa có AdMob SSV)' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  claimAdReward(@CurrentUser() user: AuthUser, @IdempotencyKey(true) key: string) {
    return this.adReward.claim(user.id, key);
  }

  @Public()
  @Get('deals')
  @ApiOperation({ summary: 'Danh sách special deals' })
  deals() {
    return this.shop.listDeals();
  }

  @Post('deals/:id/redeem')
  @ApiOperation({ summary: 'Đổi deal (ATOMIC) — idempotency-key bắt buộc' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  redeem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @IdempotencyKey(true) key: string,
  ) {
    return this.shop.redeemDeal(user.id, id, key);
  }

  @Public()
  @Get('offers')
  @ApiOperation({ summary: 'Danh mục offer wall tĩnh (kiếm Gold) — fallback khi chưa đăng nhập' })
  offers() {
    return this.shop.listOffers();
  }

  @Get('offers/live')
  @ApiOperation({ summary: 'Offer wall LIVE (Lootably) theo user hiện tại' })
  liveOffers(@CurrentUser() user: AuthUser, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    return this.shop.listLiveOffers(user.id, ip, userAgent);
  }

  @Public()
  @Get('iap-packages')
  @ApiOperation({ summary: 'Danh sách gói nạp Diamond (IAP)' })
  iapPackages() {
    return this.shop.listIapPackages();
  }

  @Public()
  @Get('daily-reward')
  @ApiOperation({ summary: 'Cấu hình daily reward' })
  dailyRewardConfig() {
    return this.dailyReward.listConfig();
  }

  @Get('daily-reward/status')
  @ApiOperation({ summary: 'Trạng thái điểm danh hôm nay (claimedToday)' })
  dailyRewardStatus(@CurrentUser() user: AuthUser) {
    return this.dailyReward.status(user.id);
  }

  @Post('daily-reward/claim')
  @ApiOperation({ summary: 'Điểm danh nhận Green (1 lần/ngày)' })
  claimDaily(@CurrentUser() user: AuthUser) {
    return this.dailyReward.claim(user.id);
  }

  @Get('gifts')
  @ApiOperation({ summary: 'Ví quà (lazy expire)' })
  gifts(@CurrentUser() user: AuthUser) {
    return this.gift.list(user.id);
  }

  @Post('gifts/:id/use')
  @ApiOperation({ summary: 'Dùng quà digital (ACTIVE→USED)' })
  useGift(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gift.useDigital(user.id, id);
  }

  @Post('gifts/:id/confirm')
  @ApiOperation({ summary: 'Xác nhận quà physical (PENDING→CONFIRMED)' })
  confirmGift(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ConfirmPhysicalDto,
  ) {
    return this.gift.confirmPhysical(user.id, id, dto.shippingAddressId);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Địa chỉ giao hàng của tôi' })
  addresses(@CurrentUser() user: AuthUser) {
    return this.gift.listAddresses(user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ giao hàng' })
  createAddress(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
    return this.gift.createAddress(user.id, dto);
  }
}
