import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { LeaderboardService } from './leaderboard.service';

// Admin duyệt & trao thưởng leaderboard — §17.
@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/leaderboards')
export class LeaderboardAdminController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Snapshot chờ duyệt thưởng (PENDING)' })
  pending() {
    return this.leaderboard.listPending();
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Duyệt thưởng (PENDING→APPROVED)' })
  approve(@CurrentUser() admin: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.leaderboard.approve(admin.id, id);
  }

  @Post(':id/grant')
  @ApiOperation({ summary: 'Trao thưởng (APPROVED→SENT) + notification' })
  grant(@CurrentUser() admin: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.leaderboard.grant(admin.id, id);
  }
}
