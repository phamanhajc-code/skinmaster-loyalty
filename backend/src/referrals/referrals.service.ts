import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ReferralStatus, ReferralType, VoucherSourceType } from '@prisma/client';
import { generateReferralDisplayCode } from '../common/codegen.util';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { RecordReferralDto } from './dto/record-referral.dto';

const REFERRAL_INCLUDE = { referrer: true, referred: true, vouchers: true } as const;

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly vouchersService: VouchersService,
  ) {}

  list(filter: { status?: ReferralStatus; referralType?: ReferralType }) {
    return this.prisma.referral.findMany({
      where: { status: filter.status, referralType: filter.referralType },
      include: REFERRAL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const referral = await this.prisma.referral.findUnique({ where: { id }, include: REFERRAL_INCLUDE });
    if (!referral) throw new NotFoundException('Không tìm thấy lượt giới thiệu');
    return referral;
  }

  private async matchPolicyTier(referralType: ReferralType, triggerAmount: number) {
    const tiers = await this.prisma.referralPolicyTier.findMany({
      where: { referralType, active: true },
      orderBy: { minTriggerAmount: 'desc' },
    });
    return tiers.find((t) => triggerAmount >= Number(t.minTriggerAmount)) ?? null;
  }

  async record(dto: RecordReferralDto) {
    const referrer = await this.customersService.findById(dto.referrerCustomerId);

    const referred = dto.referredCustomerId
      ? await this.customersService.findById(dto.referredCustomerId)
      : dto.newReferredCustomer
        ? await this.customersService.findOrCreateByPhone({
            ...dto.newReferredCustomer,
            referredByReferralCode: referrer.referralCode,
          })
        : null;

    if (!referred) {
      throw new BadRequestException('Cần cung cấp referredCustomerId hoặc thông tin người được giới thiệu mới');
    }

    const previewTier = await this.matchPolicyTier(dto.referralType, dto.triggerAmount);

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.prisma.referral.create({
          data: {
            displayCode: generateReferralDisplayCode(),
            referrerCustomerId: referrer.id,
            referredCustomerId: referred.id,
            referralType: dto.referralType,
            triggerAmount: dto.triggerAmount,
            rewardForReferrer: previewTier?.rewardForReferrer,
            rewardForReferred: previewTier?.rewardForReferred,
            status: ReferralStatus.pending,
          },
          include: REFERRAL_INCLUDE,
        });
      } catch (err: any) {
        if (err?.code === 'P2002' && attempt < 4) continue;
        throw err;
      }
    }
    throw new ConflictException('Không thể sinh mã giới thiệu, vui lòng thử lại');
  }

  async approve(id: string) {
    const referral = await this.findById(id);
    if (referral.status !== ReferralStatus.pending) {
      throw new BadRequestException('Chỉ có thể duyệt lượt giới thiệu đang ở trạng thái chờ xử lý');
    }

    const tier = await this.matchPolicyTier(referral.referralType, Number(referral.triggerAmount));
    if (!tier) {
      throw new BadRequestException('Không tìm thấy chính sách thưởng phù hợp với giá trị giao dịch này');
    }

    const expiresAt = new Date(Date.now() + tier.voucherValidityDays * 24 * 60 * 60 * 1000);
    for (const amount of tier.referrerVoucherAmounts) {
      await this.vouchersService.createVoucher({
        customerId: referral.referrerCustomerId,
        value: amount,
        sourceType: VoucherSourceType.referral,
        sourceLabel: tier.label,
        expiresAt,
        referralId: referral.id,
      });
    }

    return this.prisma.referral.update({
      where: { id },
      data: {
        status: ReferralStatus.rewarded,
        rewardedAt: new Date(),
        rewardForReferrer: tier.rewardForReferrer,
        rewardForReferred: tier.rewardForReferred,
      },
      include: REFERRAL_INCLUDE,
    });
  }

  async cancel(id: string) {
    const referral = await this.findById(id);
    if (referral.status !== ReferralStatus.pending) {
      throw new BadRequestException('Chỉ có thể huỷ lượt giới thiệu đang ở trạng thái chờ xử lý');
    }
    return this.prisma.referral.update({ where: { id }, data: { status: ReferralStatus.cancelled } });
  }

  countThisMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.prisma.referral.count({
      where: { status: ReferralStatus.rewarded, rewardedAt: { gte: start } },
    });
  }

  findMineAsReferrer(customerId: string) {
    return this.prisma.referral.findMany({
      where: { referrerCustomerId: customerId },
      include: { referred: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
