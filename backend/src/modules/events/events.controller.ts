import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Banner point event đang diễn ra (countdown)' })
  active() {
    return this.events.getActive();
  }
}
