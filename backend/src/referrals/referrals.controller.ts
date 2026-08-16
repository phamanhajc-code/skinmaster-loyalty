import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ReferralStatus, ReferralType } from '@prisma/client';
import { AdminAuthGuard } from '../common/jwt-auth.guard';
import { RecordReferralDto } from './dto/record-referral.dto';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
@UseGuards(AdminAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get()
  list(@Query('status') status?: ReferralStatus, @Query('referralType') referralType?: ReferralType) {
    return this.referralsService.list({ status, referralType });
  }

  @Post()
  record(@Body() dto: RecordReferralDto) {
    return this.referralsService.record(dto);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.referralsService.approve(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.referralsService.cancel(id);
  }
}
