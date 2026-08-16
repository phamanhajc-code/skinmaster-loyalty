import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VouchersService } from '../vouchers/vouchers.service';

/**
 * Daily housekeeping per spec 7.3: expire overdue vouchers and flag ones
 * expiring soon. The "expiring soon" reminder currently only logs — wire it
 * to the OTP_PROVIDER-style notification channel once a real SMS/Zalo ZNS
 * vendor is configured.
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly vouchersService: VouchersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleVoucherExpiry() {
    const expiredCount = await this.vouchersService.expireOverdue();
    const expiringSoonCount = await this.vouchersService.expiringWithinDays(7);
    this.logger.log(
      `Voucher housekeeping: ${expiredCount} vừa hết hạn, ${expiringSoonCount} sắp hết hạn trong 7 ngày tới`,
    );
  }
}
