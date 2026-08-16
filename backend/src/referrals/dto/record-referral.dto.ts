import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Matches, Min, ValidateNested } from 'class-validator';
import { ReferralType } from '@prisma/client';

class NewReferredCustomerDto {
  @IsString()
  fullName: string;

  @Matches(/^[0-9+\s]{8,15}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class RecordReferralDto {
  @IsString()
  referrerCustomerId: string;

  @IsOptional()
  @IsString()
  referredCustomerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewReferredCustomerDto)
  newReferredCustomer?: NewReferredCustomerDto;

  @IsEnum(ReferralType)
  referralType: ReferralType;

  @IsNumber()
  @Min(0)
  triggerAmount: number;
}
