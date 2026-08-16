import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/current-user.decorator';
import { CardsService } from './cards.service';
import { TopUpDto, UseServiceDto } from './dto/card-actions.dto';
import { IssueCardDto } from './dto/issue-card.dto';

@Controller('cards')
@UseGuards(AdminAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  list(@Query('search') search?: string, @Query('tierCode') tierCode?: string) {
    return this.cardsService.list({ search, tierCode });
  }

  @Get('tier-distribution')
  tierDistribution() {
    return this.cardsService.tierDistribution();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.cardsService.findById(id);
  }

  @Post()
  issueCard(@Body() dto: IssueCardDto) {
    return this.cardsService.issueCard(dto);
  }

  @Post(':id/top-up')
  topUp(@Param('id') id: string, @Body() dto: TopUpDto, @CurrentUser() user: AuthUser) {
    return this.cardsService.topUp(id, dto, user.sub);
  }

  @Post(':id/use-service')
  useService(@Param('id') id: string, @Body() dto: UseServiceDto, @CurrentUser() user: AuthUser) {
    return this.cardsService.useService(id, dto, user.sub);
  }
}
