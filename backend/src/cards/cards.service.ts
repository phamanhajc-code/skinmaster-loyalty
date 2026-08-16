import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CardStatus, TransactionType } from '@prisma/client';
import { generateCardCode } from '../common/codegen.util';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { IssueCardDto } from './dto/issue-card.dto';
import { TopUpDto, UseServiceDto } from './dto/card-actions.dto';

const CARD_INCLUDE = { customer: true, tierPolicy: true } as const;

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
  ) {}

  list(filter: { search?: string; tierCode?: string }) {
    return this.prisma.membershipCard.findMany({
      where: {
        tierCode: filter.tierCode || undefined,
        customer: filter.search
          ? {
              OR: [
                { fullName: { contains: filter.search, mode: 'insensitive' } },
                { phone: { contains: filter.search } },
              ],
            }
          : undefined,
      },
      include: CARD_INCLUDE,
      orderBy: { activatedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const card = await this.prisma.membershipCard.findUnique({
      where: { id },
      include: { ...CARD_INCLUDE, transactions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!card) throw new NotFoundException('Không tìm thấy thẻ thành viên');
    return card;
  }

  async issueCard(dto: IssueCardDto) {
    const tierPolicy = await this.prisma.tierPolicy.findUnique({ where: { code: dto.tierCode } });
    if (!tierPolicy || !tierPolicy.active) {
      throw new BadRequestException('Hạng thẻ không hợp lệ');
    }

    const customer = dto.customerId
      ? await this.customersService.findById(dto.customerId)
      : dto.newCustomer
        ? await this.customersService.findOrCreateByPhone(dto.newCustomer)
        : null;

    if (!customer) {
      throw new BadRequestException('Cần cung cấp customerId hoặc thông tin khách hàng mới');
    }

    const initialValue = tierPolicy.minTopupValue;
    const bonusValue = tierPolicy.bonusValue;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const card = await tx.membershipCard.create({
            data: {
              customerId: customer.id,
              cardCode: generateCardCode(dto.tierCode),
              tierCode: tierPolicy.code,
              initialValue,
              bonusValue,
              balance: initialValue.add(bonusValue),
              bundledServiceName: tierPolicy.bundledServiceName,
              bundledServiceValue: tierPolicy.bundledServiceValue,
              status: CardStatus.active,
            },
            include: CARD_INCLUDE,
          });

          await tx.transaction.create({
            data: { cardId: card.id, type: TransactionType.top_up, amount: initialValue },
          });
          await tx.transaction.create({
            data: { cardId: card.id, type: TransactionType.bonus_credit, amount: bonusValue },
          });

          return card;
        });
      } catch (err: any) {
        if (err?.code === 'P2002' && attempt < 4) continue;
        throw err;
      }
    }
    throw new ConflictException('Không thể sinh mã thẻ, vui lòng thử lại');
  }

  async topUp(cardId: string, dto: TopUpDto, staffId?: string) {
    const card = await this.findById(cardId);
    if (card.status === CardStatus.locked) {
      throw new BadRequestException('Thẻ đang bị khoá, không thể nạp thêm');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.membershipCard.update({
        where: { id: cardId },
        data: {
          balance: { increment: dto.amount },
          status: CardStatus.active,
        },
        include: CARD_INCLUDE,
      });
      await tx.transaction.create({
        data: { cardId, type: TransactionType.top_up, amount: dto.amount, staffId },
      });
      return updated;
    });
  }

  async useService(cardId: string, dto: UseServiceDto, staffId?: string) {
    const card = await this.findById(cardId);
    if (card.status !== CardStatus.active) {
      throw new BadRequestException('Thẻ không ở trạng thái hoạt động');
    }
    if (Number(card.balance) < dto.amount) {
      throw new BadRequestException('Số dư thẻ không đủ để thực hiện giao dịch này');
    }

    return this.prisma.$transaction(async (tx) => {
      const remaining = Number(card.balance) - dto.amount;
      const updated = await tx.membershipCard.update({
        where: { id: cardId },
        data: {
          balance: { decrement: dto.amount },
          status: remaining <= 0 ? CardStatus.used_up : CardStatus.active,
        },
        include: CARD_INCLUDE,
      });
      await tx.transaction.create({
        data: {
          cardId,
          type: TransactionType.usage,
          amount: -dto.amount,
          serviceName: dto.serviceName,
          staffId,
        },
      });
      return updated;
    });
  }

  tierDistribution() {
    return this.prisma.membershipCard.groupBy({
      by: ['tierCode'],
      _count: { _all: true },
    });
  }
}
