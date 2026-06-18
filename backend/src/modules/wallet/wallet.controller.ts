import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ConvertDiamondDto } from './dto/convert-diamond.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Số dư 3 loại tiền (Green chỉ tính lot chưa hết hạn)' })
  balance(@CurrentUser() user: AuthUser) {
    return this.wallet.getBalances(user.id);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Lịch sử ledger (cursor pagination)' })
  history(@CurrentUser() user: AuthUser, @Query() q: PaginationQueryDto) {
    return this.wallet.getHistory(user.id, q);
  }

  @Post('convert-diamond')
  @ApiOperation({ summary: 'Đổi Diamond → Gold (một chiều, không hoàn)' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  convertDiamond(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConvertDiamondDto,
    @IdempotencyKey(true) key: string,
  ) {
    return this.wallet.convertDiamondToGold(user.id, dto.diamonds, key);
  }
}
