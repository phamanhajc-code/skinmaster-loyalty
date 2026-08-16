import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { AdminAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UpsertReferralPoliciesDto, UpsertTierPoliciesDto } from './dto/policy.dto';
import { PolicyService } from './policy.service';

@Controller('policy')
@UseGuards(AdminAuthGuard, RolesGuard)
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get('tiers')
  getTiers() {
    return this.policyService.getTiers();
  }

  @Put('tiers')
  @Roles(AdminRole.super_admin)
  upsertTiers(@Body() dto: UpsertTierPoliciesDto) {
    return this.policyService.upsertTiers(dto.tiers);
  }

  @Get('referral-tiers')
  getReferralTiers() {
    return this.policyService.getReferralTiers();
  }

  @Put('referral-tiers')
  @Roles(AdminRole.super_admin)
  upsertReferralTiers(@Body() dto: UpsertReferralPoliciesDto) {
    return this.policyService.upsertReferralTiers(dto.tiers);
  }
}
