import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { generateReferralCode } from '../common/codegen.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { referralCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: { cards: true },
    });
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { cards: { include: { tierPolicy: true } }, vouchers: true },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');
    return customer;
  }

  findByPhone(phone: string) {
    return this.prisma.customer.findUnique({ where: { phone: phone.replace(/\s+/g, '') } });
  }

  /** Creates a customer, resolving `referredByReferralCode` if provided. Retries on the rare referral-code collision. */
  async create(dto: CreateCustomerDto): Promise<Customer> {
    const phone = dto.phone.replace(/\s+/g, '');
    const existing = await this.prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('Số điện thoại đã tồn tại trong hệ thống');
    }

    let referredByCustomerId: string | undefined;
    if (dto.referredByReferralCode) {
      const referrer = await this.prisma.customer.findUnique({
        where: { referralCode: dto.referredByReferralCode },
      });
      if (!referrer) {
        throw new NotFoundException('Không tìm thấy mã giới thiệu');
      }
      referredByCustomerId = referrer.id;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.prisma.customer.create({
          data: {
            fullName: dto.fullName,
            phone,
            email: dto.email,
            referralCode: generateReferralCode(dto.fullName),
            referredByCustomerId,
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002' && attempt < 4) continue;
        throw err;
      }
    }
    throw new ConflictException('Không thể tạo mã giới thiệu, vui lòng thử lại');
  }

  async findOrCreateByPhone(dto: CreateCustomerDto): Promise<Customer> {
    const phone = dto.phone.replace(/\s+/g, '');
    const existing = await this.prisma.customer.findUnique({ where: { phone } });
    if (existing) return existing;
    return this.create(dto);
  }
}
