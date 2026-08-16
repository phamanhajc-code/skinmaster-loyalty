-- AlterTable
ALTER TABLE "referral_policy_tiers" ADD COLUMN     "referrerVoucherAmounts" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "voucherValidityDays" INTEGER NOT NULL DEFAULT 30;
