import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ReferralType } from '@prisma/client';

export class TierPolicyItemDto {
  @IsString()
  code: string;

  @IsString()
  displayName: string;

  @IsNumber()
  @Min(0)
  minTopupValue: number;

  @IsNumber()
  @Min(0)
  bonusValue: number;

  @IsString()
  bundledServiceName: string;

  @IsNumber()
  @Min(0)
  bundledServiceValue: number;

  @IsInt()
  sortOrder: number;

  @IsBoolean()
  active: boolean;
}

export class UpsertTierPoliciesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TierPolicyItemDto)
  tiers: TierPolicyItemDto[];
}

export class ReferralPolicyItemDto {
  @IsEnum(ReferralType)
  referralType: ReferralType;

  @IsString()
  label: string;

  @IsNumber()
  @Min(0)
  minTriggerAmount: number;

  @IsString()
  rewardForReferred: string;

  @IsString()
  rewardForReferrer: string;

  @IsArray()
  @IsInt({ each: true })
  referrerVoucherAmounts: number[];

  @IsInt()
  voucherValidityDays: number;

  @IsInt()
  sortOrder: number;

  @IsBoolean()
  active: boolean;
}

export class UpsertReferralPoliciesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReferralPolicyItemDto)
  tiers: ReferralPolicyItemDto[];
}
