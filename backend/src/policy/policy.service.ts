import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralPolicyItemDto, TierPolicyItemDto } from './dto/policy.dto';

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  getTiers() {
    return this.prisma.tierPolicy.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async upsertTiers(tiers: TierPolicyItemDto[]) {
    const codes = tiers.map((t) => t.code);
    await this.prisma.$transaction([
      this.prisma.tierPolicy.deleteMany({ where: { code: { notIn: codes } } }),
      ...tiers.map((tier) =>
        this.prisma.tierPolicy.upsert({
          where: { code: tier.code },
          create: tier,
          update: tier,
        }),
      ),
    ]);
    return this.getTiers();
  }

  getReferralTiers() {
    return this.prisma.referralPolicyTier.findMany({ orderBy: [{ referralType: 'asc' }, { sortOrder: 'asc' }] });
  }

  async upsertReferralTiers(tiers: ReferralPolicyItemDto[]) {
    await this.prisma.$transaction([
      this.prisma.referralPolicyTier.deleteMany({}),
      this.prisma.referralPolicyTier.createMany({ data: tiers }),
    ]);
    return this.getReferralTiers();
  }
}
