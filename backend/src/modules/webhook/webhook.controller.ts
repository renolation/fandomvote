import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { IapWebhookDto, LootablyPostbackDto, OfferwallPostbackDto } from './dto/webhook.dto';
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

  // GET theo yêu cầu Lootably; PHẢI trả body thô "1" → dùng @Res() bỏ qua envelope { data }.
  @Public()
  @Get('offerwall/lootably')
  @ApiOperation({ summary: 'Lootably offerwall postback (GET, verify SHA256) → Gold' })
  async lootably(@Query() q: LootablyPostbackDto, @Res() res: Response): Promise<void> {
    await this.webhook.handleLootablyPostback(q);
    res.status(200).type('text/plain').send('1');
  }
}
