import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { Public } from '../../common/decorators/public.decorator';
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
  ) {}

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
  @ApiOperation({ summary: 'Danh mục offer wall (kiếm Gold)' })
  offers() {
    return this.shop.listOffers();
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
