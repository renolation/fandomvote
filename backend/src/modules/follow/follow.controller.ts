import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { FollowService } from './follow.service';

@ApiTags('follow')
@ApiBearerAuth()
@Controller('follows')
export class FollowController {
  constructor(private readonly follow: FollowService) {}

  @Get()
  @ApiOperation({ summary: 'Idol tôi đang theo dõi (mới nhất trước)' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.follow.listMine(user.id);
  }

  @Post(':idolId')
  @ApiOperation({ summary: 'Theo dõi idol (idempotent)' })
  followIdol(@CurrentUser() user: AuthUser, @Param('idolId') idolId: string) {
    return this.follow.follow(user.id, idolId);
  }

  @Post(':idolId/unfollow')
  @ApiOperation({ summary: 'Bỏ theo dõi idol' })
  unfollowIdol(@CurrentUser() user: AuthUser, @Param('idolId') idolId: string) {
    return this.follow.unfollow(user.id, idolId);
  }
}
