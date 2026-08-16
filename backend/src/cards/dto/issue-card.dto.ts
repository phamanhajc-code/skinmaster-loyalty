import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';

class NewCustomerDto {
  @IsString()
  fullName: string;

  @Matches(/^[0-9+\s]{8,15}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class IssueCardDto {
  @IsString()
  tierCode: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewCustomerDto)
  newCustomer?: NewCustomerDto;
}
