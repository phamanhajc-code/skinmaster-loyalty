import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { VoucherStatus } from '@prisma/client';
import { AdminAuthGuard } from '../common/jwt-auth.guard';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { VouchersService } from './vouchers.service';

@Controller('vouchers')
@UseGuards(AdminAuthGuard)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  list(@Query('status') status?: VoucherStatus, @Query('customerId') customerId?: string) {
    return this.vouchersService.list({ status, customerId });
  }

  @Post()
  create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.createManual(dto);
  }

  @Post(':id/use')
  markUsed(@Param('id') id: string) {
    return this.vouchersService.markUsed(id);
  }
}
