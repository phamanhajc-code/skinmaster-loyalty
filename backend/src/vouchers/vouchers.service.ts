import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VoucherSourceType, VoucherStatus } from '@prisma/client';
import { generateVoucherCode } from '../common/codegen.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';

const DEFAULT_VALIDITY_DAYS = 30;

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(private readonly prisma: PrismaService) {}

  list(filter: { status?: VoucherStatus; customerId?: string }) {
    return this.prisma.voucher.findMany({
      where: { status: filter.status, customerId: filter.customerId },
      include: { customer: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const voucher = await this.prisma.voucher.findUnique({ where: { id }, include: { customer: true } });
    if (!voucher) throw new NotFoundException('Không tìm thấy voucher');
    return voucher;
  }

  async createManual(dto: CreateVoucherDto) {
    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + DEFAULT_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

    return this.createVoucher({
      customerId: dto.customerId,
      value: dto.value,
      sourceType: VoucherSourceType.manual,
      sourceLabel: dto.sourceLabel,
      expiresAt,
    });
  }

  /** Used internally by the referral-approval flow and tier bonus issuance. */
  async createVoucher(params: {
    customerId: string;
    value: number;
    sourceType: VoucherSourceType;
    sourceLabel: string;
    expiresAt: Date;
    referralId?: string;
  }) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.prisma.voucher.create({
          data: {
            voucherCode: generateVoucherCode(),
            customerId: params.customerId,
            value: params.value,
            sourceType: params.sourceType,
            sourceLabel: params.sourceLabel,
            referralId: params.referralId,
            expiresAt: params.expiresAt,
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002' && attempt < 4) continue;
        throw err;
      }
    }
    throw new ConflictException('Không thể sinh mã voucher, vui lòng thử lại');
  }

  async markUsed(id: string) {
    const voucher = await this.findById(id);
    if (voucher.status !== VoucherStatus.active) {
      throw new BadRequestException('Voucher không ở trạng thái còn hiệu lực');
    }
    return this.prisma.voucher.update({
      where: { id },
      data: { status: VoucherStatus.used, usedAt: new Date() },
    });
  }

  /** Flips active vouchers whose expiresAt has passed to `expired`. Called by the daily cron job. */
  async expireOverdue() {
    const result = await this.prisma.voucher.updateMany({
      where: { status: VoucherStatus.active, expiresAt: { lt: new Date() } },
      data: { status: VoucherStatus.expired },
    });
    if (result.count > 0) {
      this.logger.log(`Đã chuyển ${result.count} voucher sang trạng thái hết hạn`);
    }
    return result.count;
  }

  expiringWithinDays(days: number) {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.prisma.voucher.count({
      where: { status: VoucherStatus.active, expiresAt: { lte: until } },
    });
  }
}
