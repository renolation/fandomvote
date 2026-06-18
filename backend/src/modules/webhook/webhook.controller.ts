import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { IapWebhookDto, OfferwallPostbackDto } from './dto/webhook.dto';
import { WebhookService } from './webhook.service';

// Public (xác thực bằng signature, không JWT). Không throttle theo user.
@ApiTags('webhook')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhook: WebhookService) {}

  @Public()
  @Post('offerwall')
  @ApiOperation({ summary: 'Offerwall postback → Gold (verify signature, replay-safe)' })
  offerwall(@Body() dto: OfferwallPostbackDto) {
    return this.webhook.handleOfferwallPostback(dto);
  }

  @Public()
  @Post('iap')
  @ApiOperation({ summary: 'IAP webhook → Diamond (verify + chống replay)' })
  iap(@Body() dto: IapWebhookDto) {
    return this.webhook.handleIapWebhook(dto);
  }
}
