-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('super_admin', 'operator');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('active', 'used_up', 'locked');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('top_up', 'usage', 'bonus_credit');

-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('card_purchase', 'online_purchase');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'rewarded', 'cancelled');

-- CreateEnum
CREATE TYPE "VoucherSourceType" AS ENUM ('referral', 'tier_bonus', 'manual');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('active', 'used', 'expired');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'operator',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "referralCode" TEXT NOT NULL,
    "referredByCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_otps" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_cards" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cardCode" TEXT NOT NULL,
    "tierCode" TEXT NOT NULL,
    "initialValue" DECIMAL(14,2) NOT NULL,
    "bonusValue" DECIMAL(14,2) NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL,
    "bundledServiceName" TEXT NOT NULL,
    "bundledServiceValue" DECIMAL(14,2) NOT NULL,
    "bundledServiceUsed" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CardStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "membership_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "serviceName" TEXT,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "displayCode" TEXT NOT NULL,
    "referrerCustomerId" TEXT NOT NULL,
    "referredCustomerId" TEXT NOT NULL,
    "referralType" "ReferralType" NOT NULL,
    "triggerAmount" DECIMAL(14,2) NOT NULL,
    "rewardForReferrer" TEXT,
    "rewardForReferred" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardedAt" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "voucherCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "sourceType" "VoucherSourceType" NOT NULL,
    "referralId" TEXT,
    "sourceLabel" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'active',
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_policies" (
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "minTopupValue" DECIMAL(14,2) NOT NULL,
    "bonusValue" DECIMAL(14,2) NOT NULL,
    "bundledServiceName" TEXT NOT NULL,
    "bundledServiceValue" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tier_policies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "referral_policy_tiers" (
    "id" TEXT NOT NULL,
    "referralType" "ReferralType" NOT NULL,
    "label" TEXT NOT NULL,
    "minTriggerAmount" DECIMAL(14,2) NOT NULL,
    "rewardForReferred" TEXT NOT NULL,
    "rewardForReferrer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "referral_policy_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_referralCode_key" ON "customers"("referralCode");

-- CreateIndex
CREATE INDEX "customer_otps_phone_idx" ON "customer_otps"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "membership_cards_cardCode_key" ON "membership_cards"("cardCode");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_displayCode_key" ON "referrals"("displayCode");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_voucherCode_key" ON "vouchers"("voucherCode");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_referredByCustomerId_fkey" FOREIGN KEY ("referredByCustomerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_otps" ADD CONSTRAINT "customer_otps_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_cards" ADD CONSTRAINT "membership_cards_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_cards" ADD CONSTRAINT "membership_cards_tierCode_fkey" FOREIGN KEY ("tierCode") REFERENCES "tier_policies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "membership_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerCustomerId_fkey" FOREIGN KEY ("referrerCustomerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredCustomerId_fkey" FOREIGN KEY ("referredCustomerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
