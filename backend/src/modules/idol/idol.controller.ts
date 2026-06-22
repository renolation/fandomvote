import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CheckDuplicateQueryDto, NominateIdolDto } from './dto/nominate-idol.dto';
import { IdolService } from './idol.service';

@ApiTags('idol')
@ApiBearerAuth()
@Controller('idols')
export class IdolController {
  constructor(private readonly idol: IdolService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách idol đã duyệt (search + cursor)' })
  list(@Query() q: PaginationQueryDto & { search?: string }) {
    return this.idol.listApproved(q);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check trùng tên real-time' })
  check(@Query() q: CheckDuplicateQueryDto) {
    return this.idol.checkDuplicate(q.name);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Idol tôi đã đề cử (mọi trạng thái)' })
  mine(@CurrentUser() user: AuthUser) {
    return this.idol.listMine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết idol' })
  get(@Param('id') id: string) {
    return this.idol.getById(id);
  }

  @Post('nominate')
  @ApiOperation({ summary: 'Đề cử idol mới (PENDING chờ admin duyệt)' })
  nominate(@CurrentUser() user: AuthUser, @Body() dto: NominateIdolDto) {
    return this.idol.nominate(user.id, dto);
  }
}
