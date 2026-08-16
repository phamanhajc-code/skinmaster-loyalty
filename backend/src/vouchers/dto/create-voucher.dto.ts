import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  customerId: string;

  @IsNumber()
  @Min(1)
  value: number;

  @IsString()
  sourceLabel: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
