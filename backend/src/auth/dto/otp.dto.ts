import { IsString, Length, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @Matches(/^[0-9+\s]{8,15}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^[0-9+\s]{8,15}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'Mã OTP gồm 6 chữ số' })
  code: string;
}
