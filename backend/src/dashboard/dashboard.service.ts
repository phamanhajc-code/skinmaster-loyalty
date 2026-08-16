import { Injectable } from '@nestjs/common';
import { CardStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralsService } from '../referrals/referrals.service';
import { VouchersService } from '../vouchers/vouchers.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referralsService: ReferralsService,
    private readonly vouchersService: VouchersService,
  ) {}

  async summary() {
    const [activeMembers, balanceAgg, referralsThisMonth, vouchersExpiringSoon] = await Promise.all([
      this.prisma.customer.count({ where: { cards: { some: { status: CardStatus.active } } } }),
      this.prisma.membershipCard.aggregate({
        _sum: { balance: true },
        where: { status: { not: CardStatus.locked } },
      }),
      this.referralsService.countThisMonth(),
      this.vouchersService.expiringWithinDays(7),
    ]);

    return {
      activeMembers,
      totalCardBalance: Number(balanceAgg._sum.balance ?? 0),
      referralsThisMonth,
      vouchersExpiringSoon,
    };
  }

  async tierDistribution() {
    const tiers = await this.prisma.tierPolicy.findMany({ orderBy: { sortOrder: 'asc' } });
    const counts = await this.prisma.membershipCard.groupBy({ by: ['tierCode'], _count: { _all: true } });
    const countByTier = Object.fromEntries(counts.map((c) => [c.tierCode, c._count._all]));
    return tiers.map((t) => ({ code: t.code, displayName: t.displayName, count: countByTier[t.code] ?? 0 }));
  }

  recentTransactions(limit = 10) {
    return this.prisma.transaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { card: { include: { customer: true } } },
    });
  }
}
