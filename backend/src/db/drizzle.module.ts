import { Global, Module } from '@nestjs/common';
import { db, DRIZZLE } from './drizzle.provider';

// Global → mọi module inject @Inject(DRIZZLE) db: Database.
@Global()
@Module({
  providers: [{ provide: DRIZZLE, useValue: db }],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
