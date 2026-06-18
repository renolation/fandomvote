import { Module } from '@nestjs/common';
import { GreenCounterService } from './green-counter.service';
import { LedgerService } from './ledger.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

// Service phụ (LedgerService, GreenCounterService) export để module khác inject — §3.
@Module({
  controllers: [WalletController],
  providers: [LedgerService, GreenCounterService, WalletService],
  exports: [LedgerService, GreenCounterService],
})
export class WalletModule {}
