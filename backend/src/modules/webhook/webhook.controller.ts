import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { IapWebhookDto, LootablyPostbackDto, OfferwallPostbackDto } from './dto/webhook.dto';
import { AdmobSsvService } from './admob-ssv.service';
import { WebhookService } from './webhook.service';

// Public (xác thực bằng signature, không JWT). Không throttle theo user.
@ApiTags('webhook')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly webhook: WebhookService,
    private readonly admobSsv: AdmobSsvService,
  ) {}

  // AdMob SSV: cần query string THÔ để verify chữ ký → lấy từ req.originalUrl, không dùng @Query().
  @Public()
  @Get('admob/ssv')
  @ApiOperation({ summary: 'AdMob SSV callback (GET, verify chữ ký ECDSA của Google) → Gold' })
  admobSsvCallback(@Req() req: Request) {
    const qi = req.originalUrl.indexOf('?');
    return this.admobSsv.handleCallback(qi >= 0 ? req.originalUrl.slice(qi + 1) : '');
  }

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
