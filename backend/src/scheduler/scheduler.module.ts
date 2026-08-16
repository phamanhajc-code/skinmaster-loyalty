import { Module } from '@nestjs/common';
import { VouchersModule } from '../vouchers/vouchers.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [VouchersModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
