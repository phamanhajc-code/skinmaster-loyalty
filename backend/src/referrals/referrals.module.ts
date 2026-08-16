import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [CustomersModule, VouchersModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
