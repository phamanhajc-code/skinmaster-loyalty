import { Module } from '@nestjs/common';
import { ReferralsModule } from '../referrals/referrals.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [ReferralsModule, VouchersModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
