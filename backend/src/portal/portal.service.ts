import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralsService } from '../referrals/referrals.service';
import { VouchersService } from '../vouchers/vouchers.service';

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referralsService: ReferralsService,
    private readonly vouchersService: VouchersService,
  ) {}

  async getProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { cards: { include: { tierPolicy: true }, orderBy: { activatedAt: 'desc' } } },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');

    const primaryCard = customer.cards.find((c) => c.status === 'active') ?? customer.cards[0] ?? null;
    return { customer, primaryCard };
  }

  async getTransactions(customerId: string) {
    return this.prisma.transaction.findMany({
      where: { card: { customerId } },
      include: { card: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  getVouchers(customerId: string) {
    return this.vouchersService.list({ customerId });
  }

  getReferrals(customerId: string) {
    return this.referralsService.findMineAsReferrer(customerId);
  }
}
