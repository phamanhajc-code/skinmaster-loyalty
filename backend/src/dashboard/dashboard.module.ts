import { Module } from '@nestjs/common';
import { ReferralsModule } from '../referrals/referrals.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ReferralsModule, VouchersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
