import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../common/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AdminAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboardService.summary();
  }

  @Get('tier-distribution')
  tierDistribution() {
    return this.dashboardService.tierDistribution();
  }

  @Get('recent-transactions')
  recentTransactions(@Query('limit') limit?: string) {
    return this.dashboardService.recentTransactions(limit ? Number(limit) : undefined);
  }
}
