import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { NotificationService } from './notification.service';

@ApiTags('notification')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notification: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách notification (cursor)' })
  list(@CurrentUser() user: AuthUser, @Query() q: PaginationQueryDto) {
    return this.notification.list(user.id, q);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Badge số chưa đọc' })
  async unread(@CurrentUser() user: AuthUser) {
    return { count: await this.notification.unreadCount(user.id) };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc' })
  async read(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.notification.markRead(user.id, id);
    return { success: true };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả đã đọc' })
  async readAll(@CurrentUser() user: AuthUser) {
    await this.notification.markAllRead(user.id);
    return { success: true };
  }
}
