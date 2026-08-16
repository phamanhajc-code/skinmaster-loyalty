import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TopUpDto {
  @IsNumber()
  @Min(1)
  amount: number;
}

export class UseServiceDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  serviceName: string;

  @IsOptional()
  @IsString()
  note?: string;
}
