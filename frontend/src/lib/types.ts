export type CardStatus = 'active' | 'used_up' | 'locked';
export type TransactionType = 'top_up' | 'usage' | 'bonus_credit';
export type ReferralType = 'card_purchase' | 'online_purchase';
export type ReferralStatus = 'pending' | 'rewarded' | 'cancelled';
export type VoucherSourceType = 'referral' | 'tier_bonus' | 'manual';
export type VoucherStatus = 'active' | 'used' | 'expired';
export type AdminRole = 'super_admin' | 'operator';

export interface TierPolicy {
  code: string;
  displayName: string;
  minTopupValue: string;
  bonusValue: string;
  bundledServiceName: string;
  bundledServiceValue: string;
  sortOrder: number;
  active: boolean;
}

export interface ReferralPolicyTier {
  id: string;
  referralType: ReferralType;
  label: string;
  minTriggerAmount: string;
  rewardForReferred: string;
  rewardForReferrer: string;
  referrerVoucherAmounts: number[];
  voucherValidityDays: number;
  sortOrder: number;
  active: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  referralCode: string;
  referredByCustomerId: string | null;
  createdAt: string;
  cards?: MembershipCard[];
}

export interface MembershipCard {
  id: string;
  customerId: string;
  cardCode: string;
  tierCode: string;
  initialValue: string;
  bonusValue: string;
  balance: string;
  bundledServiceName: string;
  bundledServiceValue: string;
  bundledServiceUsed: boolean;
  activatedAt: string;
  status: CardStatus;
  customer?: Customer;
  tierPolicy?: TierPolicy;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  cardId: string;
  type: TransactionType;
  amount: string;
  serviceName: string | null;
  staffId: string | null;
  createdAt: string;
  card?: MembershipCard;
}

export interface Referral {
  id: string;
  displayCode: string;
  referrerCustomerId: string;
  referredCustomerId: string;
  referralType: ReferralType;
  triggerAmount: string;
  rewardForReferrer: string | null;
  rewardForReferred: string | null;
  status: ReferralStatus;
  createdAt: string;
  rewardedAt: string | null;
  referrer?: Customer;
  referred?: Customer;
  vouchers?: Voucher[];
}

export interface Voucher {
  id: string;
  voucherCode: string;
  customerId: string;
  value: string;
  sourceType: VoucherSourceType;
  referralId: string | null;
  sourceLabel: string;
  issuedAt: string;
  expiresAt: string;
  status: VoucherStatus;
  usedAt: string | null;
  customer?: Customer;
}

export interface DashboardSummary {
  activeMembers: number;
  totalCardBalance: number;
  referralsThisMonth: number;
  vouchersExpiringSoon: number;
}

export interface TierDistributionItem {
  code: string;
  displayName: string;
  count: number;
}
