import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { VoteService } from './vote.service';

@ApiTags('vote')
@ApiBearerAuth()
@Controller('votes')
export class VoteController {
  constructor(private readonly vote: VoteService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Vote atomic (Green→Gold), idempotency-key bắt buộc' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  cast(
    @CurrentUser() user: AuthUser,
    @Body() dto: CastVoteDto,
    @IdempotencyKey(true) key: string,
  ) {
    return this.vote.cast(user.id, dto, key);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Hoạt động vote của tôi (cursor)' })
  activity(@CurrentUser() user: AuthUser, @Query() q: PaginationQueryDto) {
    return this.vote.getMyActivity(user.id, q.limit, q.cursor);
  }
}
