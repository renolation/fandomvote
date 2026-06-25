import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { BoardQueryDto } from './dto/board-query.dto';
import { IdolBoardQueryDto } from './dto/idol-board-query.dto';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboards')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Top Voter / Top Earner theo kỳ (DAY/WEEK/MONTH)' })
  board(@Query() q: BoardQueryDto) {
    return this.leaderboard.getBoard(q.type, q.period, q.limit);
  }

  @Public()
  @Get('idols')
  @ApiOperation({ summary: 'Top Idol theo kỳ (DAY/WEEK/MONTH)' })
  idolBoard(@Query() q: IdolBoardQueryDto) {
    return this.leaderboard.getIdolBoard(q.period);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Xếp hạng của tôi (rank + score) theo kỳ' })
  myRank(@CurrentUser() user: AuthUser, @Query() q: BoardQueryDto) {
    return this.leaderboard.getMyRank(user.id, q.type, q.period);
  }
}
