import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/current-user.decorator';
import { CustomerAuthGuard } from '../common/jwt-auth.guard';
import { PortalService } from './portal.service';

@Controller('me')
@UseGuards(CustomerAuthGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthUser) {
    return this.portalService.getProfile(user.sub);
  }

  @Get('transactions')
  getTransactions(@CurrentUser() user: AuthUser) {
    return this.portalService.getTransactions(user.sub);
  }

  @Get('vouchers')
  getVouchers(@CurrentUser() user: AuthUser) {
    return this.portalService.getVouchers(user.sub);
  }

  @Get('referrals')
  getReferrals(@CurrentUser() user: AuthUser) {
    return this.portalService.getReferrals(user.sub);
  }
}
