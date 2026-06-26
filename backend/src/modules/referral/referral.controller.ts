import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReferralService } from './referral.service';

@ApiTags('referral')
@ApiBearerAuth()
@Controller('referrals')
export class ReferralController {
  constructor(private readonly referral: ReferralService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mã mời (=username) + thống kê lượt mời' })
  me(@CurrentUser() user: AuthUser) {
    return this.referral.getStats(user.id);
  }
}
