import { Module } from '@nestjs/common';
import { IdolController } from './idol.controller';
import { IdolService } from './idol.service';

@Module({
  controllers: [IdolController],
  providers: [IdolService],
  exports: [IdolService],
})
export class IdolModule {}
