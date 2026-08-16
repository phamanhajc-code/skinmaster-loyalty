import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  fullName: string;

  @Matches(/^[0-9+\s]{8,15}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  referredByReferralCode?: string;
}
