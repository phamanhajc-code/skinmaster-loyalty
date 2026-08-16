import { AdminRole, CardStatus, PrismaClient, ReferralStatus, ReferralType, TransactionType, VoucherSourceType, VoucherStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmins() {
  const superAdminPassword = await bcrypt.hash('Admin@123', 10);
  const operatorPassword = await bcrypt.hash('Operator@123', 10);

  await prisma.adminUser.upsert({
    where: { email: 'admin@skinmaster.edu.vn' },
    update: {},
    create: {
      fullName: 'Quản trị viên Skinmaster',
      email: 'admin@skinmaster.edu.vn',
      passwordHash: superAdminPassword,
      role: AdminRole.super_admin,
    },
  });

  const operatorAccounts = [
    { fullName: 'Nhân viên Văn phòng', email: 'vanphong@skinmaster.edu.vn', department: 'Văn phòng' },
    { fullName: 'Nhân viên Sale', email: 'sale@skinmaster.edu.vn', department: 'Sale' },
    { fullName: 'Nhân viên CSKH', email: 'cskh@skinmaster.edu.vn', department: 'CSKH' },
  ];

  for (const acc of operatorAccounts) {
    await prisma.adminUser.upsert({
      where: { email: acc.email },
      update: { department: acc.department },
      create: {
        fullName: acc.fullName,
        email: acc.email,
        passwordHash: operatorPassword,
        role: AdminRole.operator,
        department: acc.department,
      },
    });
  }

  console.log('✔ Seeded admin accounts:');
  console.log('   super_admin       admin@skinmaster.edu.vn / Admin@123');
  operatorAccounts.forEach((acc) => {
    console.log(`   operator (${acc.department.padEnd(9)}) ${acc.email} / Operator@123`);
  });
}

async function seedTierPolicies() {
  const tiers = [
    { code: 'silver', displayName: 'Silver', minTopupValue: 5_000_000, bonusValue: 500_000, bundledServiceName: 'Revive Biocell', bundledServiceValue: 3_700_000, sortOrder: 1 },
    { code: 'gold', displayName: 'Gold', minTopupValue: 10_000_000, bonusValue: 1_500_000, bundledServiceName: 'Laser', bundledServiceValue: 4_500_000, sortOrder: 2 },
    { code: 'platinum', displayName: 'Platinum', minTopupValue: 20_000_000, bonusValue: 3_000_000, bundledServiceName: 'Plasma', bundledServiceValue: 5_000_000, sortOrder: 3 },
    { code: 'diamond', displayName: 'Diamond', minTopupValue: 50_000_000, bonusValue: 10_000_000, bundledServiceName: 'Skinbooster', bundledServiceValue: 9_000_000, sortOrder: 4 },
  ];

  for (const tier of tiers) {
    await prisma.tierPolicy.upsert({ where: { code: tier.code }, update: tier, create: tier });
  }
  console.log(`✔ Seeded ${tiers.length} tier policies`);
}

async function seedReferralPolicies() {
  await prisma.referralPolicyTier.deleteMany({});
  await prisma.referralPolicyTier.createMany({
    data: [
      {
        referralType: ReferralType.card_purchase,
        label: 'Mua thẻ dịch vụ trên 5.000.000đ',
        minTriggerAmount: 5_000_000,
        rewardForReferred: '01 Túi tote Skinmaster',
        rewardForReferrer: '01 Voucher 200.000đ (hạn dùng 30 ngày)',
        referrerVoucherAmounts: [200_000],
        voucherValidityDays: 30,
        sortOrder: 1,
      },
      {
        referralType: ReferralType.card_purchase,
        label: 'Mua thẻ dịch vụ trên 10.000.000đ',
        minTriggerAmount: 10_000_000,
        rewardForReferred: '01 Cốc giữ nhiệt + 01 Túi tote',
        rewardForReferrer: '01 Voucher 300.000đ (hạn dùng 30 ngày)',
        referrerVoucherAmounts: [300_000],
        voucherValidityDays: 30,
        sortOrder: 2,
      },
      {
        referralType: ReferralType.card_purchase,
        label: 'Mua thẻ dịch vụ trên 20.000.000đ',
        minTriggerAmount: 20_000_000,
        rewardForReferred: 'Combo merchandise (bình giữ nhiệt + túi tote + quạt mini)',
        rewardForReferrer: '01 Voucher 500.000đ + bộ merchandise (bình giữ nhiệt + voucher 50.000đ)',
        referrerVoucherAmounts: [500_000, 50_000],
        voucherValidityDays: 30,
        sortOrder: 3,
      },
      {
        referralType: ReferralType.online_purchase,
        label: 'Đơn hàng online đầu tiên trên 5.000.000đ',
        minTriggerAmount: 5_000_000,
        rewardForReferred: '01 Túi tote Skinmaster',
        rewardForReferrer: 'Chọn 1 trong 2: Coupon ship 30.000đ + túi tote, HOẶC Voucher 50.000đ (áp dụng đơn tiếp theo, trong 30 ngày)',
        referrerVoucherAmounts: [50_000],
        voucherValidityDays: 30,
        sortOrder: 1,
      },
    ],
  });
  console.log('✔ Seeded referral policy tiers (3.2 + 3.3)');
}

interface SeedCustomer {
  fullName: string;
  phone: string;
  referralCode: string;
  tierCode: string;
  cardCode: string;
  usageAmount: number;
  usageServiceName: string;
  activatedAt: string;
}

const SEED_CUSTOMERS: SeedCustomer[] = [
  { fullName: 'Nguyễn Thị Hạnh', phone: '0912345678', referralCode: 'SM-HANH-042', tierCode: 'diamond', cardCode: 'SM-DM-1042', usageAmount: 1_600_000, usageServiceName: 'Skinbooster', activatedAt: '2026-01-12' },
  { fullName: 'Trần Minh Anh', phone: '0987654321', referralCode: 'SM-ANH-871', tierCode: 'platinum', cardCode: 'SM-PL-0871', usageAmount: 8_800_000, usageServiceName: 'Plasma', activatedAt: '2026-03-03' },
  { fullName: 'Lê Phương Thảo', phone: '0977111222', referralCode: 'SM-THAO-590', tierCode: 'gold', cardCode: 'SM-GD-1590', usageAmount: 3_650_000, usageServiceName: 'Laser', activatedAt: '2026-04-22' },
  { fullName: 'Phạm Đức Huy', phone: '0909222333', referralCode: 'SM-HUY-231', tierCode: 'silver', cardCode: 'SM-SV-2231', usageAmount: 3_600_000, usageServiceName: 'Revive Biocell', activatedAt: '2026-05-05' },
  { fullName: 'Vũ Ngọc Lan', phone: '0933444555', referralCode: 'SM-LAN-088', tierCode: 'gold', cardCode: 'SM-GD-1088', usageAmount: 11_500_000, usageServiceName: 'Laser', activatedAt: '2026-06-18' },
  { fullName: 'Đỗ Thu Hà', phone: '0966777888', referralCode: 'SM-HA-654', tierCode: 'platinum', cardCode: 'SM-PL-0654', usageAmount: 13_500_000, usageServiceName: 'Plasma', activatedAt: '2026-07-29' },
];

async function seedCustomersAndCards() {
  const tierByCode = Object.fromEntries((await prisma.tierPolicy.findMany()).map((t) => [t.code, t]));
  const created: Record<string, { customerId: string; cardId: string }> = {};

  for (const seedCustomer of SEED_CUSTOMERS) {
    const tier = tierByCode[seedCustomer.tierCode];
    const customer = await prisma.customer.upsert({
      where: { phone: seedCustomer.phone },
      update: {},
      create: {
        fullName: seedCustomer.fullName,
        phone: seedCustomer.phone,
        referralCode: seedCustomer.referralCode,
      },
    });

    const initialValue = Number(tier.minTopupValue);
    const bonusValue = Number(tier.bonusValue);
    const balance = initialValue + bonusValue - seedCustomer.usageAmount;

    const existingCard = await prisma.membershipCard.findUnique({ where: { cardCode: seedCustomer.cardCode } });
    const card = existingCard
      ? existingCard
      : await prisma.membershipCard.create({
          data: {
            customerId: customer.id,
            cardCode: seedCustomer.cardCode,
            tierCode: tier.code,
            initialValue,
            bonusValue,
            balance,
            bundledServiceName: tier.bundledServiceName,
            bundledServiceValue: tier.bundledServiceValue,
            activatedAt: new Date(seedCustomer.activatedAt),
            status: balance <= 0 ? CardStatus.used_up : CardStatus.active,
          },
        });

    if (!existingCard) {
      await prisma.transaction.create({
        data: { cardId: card.id, type: TransactionType.top_up, amount: initialValue, createdAt: new Date(seedCustomer.activatedAt) },
      });
      await prisma.transaction.create({
        data: { cardId: card.id, type: TransactionType.bonus_credit, amount: bonusValue, createdAt: new Date(seedCustomer.activatedAt) },
      });
      await prisma.transaction.create({
        data: {
          cardId: card.id,
          type: TransactionType.usage,
          amount: -seedCustomer.usageAmount,
          serviceName: seedCustomer.usageServiceName,
        },
      });
    }

    created[seedCustomer.phone] = { customerId: customer.id, cardId: card.id };
  }

  console.log(`✔ Seeded ${SEED_CUSTOMERS.length} customers with membership cards + transactions`);
  return created;
}

async function seedReferredCustomers(referrerIds: Record<string, { customerId: string; cardId: string }>) {
  const referred = [
    { fullName: 'Bùi Thảo My', phone: '0911000001' },
    { fullName: 'Hoàng Gia Bảo', phone: '0911000002' },
    { fullName: 'Đặng Thu Uyên', phone: '0911000003' },
    { fullName: 'Ngô Khánh Linh', phone: '0911000004' },
    { fullName: 'Vương Anh Tuấn', phone: '0911000005' },
  ];

  const referrerPhoneByIndex = ['0912345678', '0987654321', '0977111222', '0909222333', '0966777888'];
  const ids: Record<string, string> = {};

  for (let i = 0; i < referred.length; i++) {
    const r = referred[i];
    const referrer = referrerIds[referrerPhoneByIndex[i]];
    const customer = await prisma.customer.upsert({
      where: { phone: r.phone },
      update: {},
      create: {
        fullName: r.fullName,
        phone: r.phone,
        referralCode: `SM-${r.fullName.split(' ').pop()?.toUpperCase()}-${100 + i}`,
        referredByCustomerId: referrer.customerId,
      },
    });
    ids[r.phone] = customer.id;
  }

  console.log(`✔ Seeded ${referred.length} referred customers`);
  return ids;
}

async function seedReferralsAndVouchers(
  referrerIds: Record<string, { customerId: string; cardId: string }>,
  referredIds: Record<string, string>,
) {
  const hanh = referrerIds['0912345678'].customerId;
  const minhAnh = referrerIds['0987654321'].customerId;
  const phuongThao = referrerIds['0977111222'].customerId;
  const ducHuy = referrerIds['0909222333'].customerId;
  const thuHa = referrerIds['0966777888'].customerId;

  const bui = referredIds['0911000001'];
  const hoang = referredIds['0911000002'];
  const dang = referredIds['0911000003'];
  const ngo = referredIds['0911000004'];
  const vuong = referredIds['0911000005'];

  const referralData = [
    {
      displayCode: 'GT-2608-014',
      referrerCustomerId: hanh,
      referredCustomerId: bui,
      referralType: ReferralType.card_purchase,
      triggerAmount: 20_000_000,
      status: ReferralStatus.pending,
      rewardForReferrer: '01 Voucher 500.000đ + bộ merchandise (bình giữ nhiệt + voucher 50.000đ)',
      rewardForReferred: 'Combo merchandise (bình giữ nhiệt + túi tote + quạt mini)',
      voucher: null as null | { value: number; label: string },
    },
    {
      displayCode: 'GT-2608-013',
      referrerCustomerId: minhAnh,
      referredCustomerId: hoang,
      referralType: ReferralType.card_purchase,
      triggerAmount: 10_000_000,
      status: ReferralStatus.rewarded,
      rewardForReferrer: '01 Voucher 300.000đ (hạn dùng 30 ngày)',
      rewardForReferred: '01 Cốc giữ nhiệt + 01 Túi tote',
      voucher: { value: 300_000, label: 'Mua thẻ dịch vụ trên 10.000.000đ' },
    },
    {
      displayCode: 'GT-2608-012',
      referrerCustomerId: phuongThao,
      referredCustomerId: dang,
      referralType: ReferralType.online_purchase,
      triggerAmount: 5_500_000,
      status: ReferralStatus.rewarded,
      rewardForReferrer: 'Coupon ship 30.000đ + túi tote',
      rewardForReferred: '01 Túi tote Skinmaster',
      voucher: { value: 50_000, label: 'Đơn hàng online đầu tiên trên 5.000.000đ' },
    },
    {
      displayCode: 'GT-2608-011',
      referrerCustomerId: ducHuy,
      referredCustomerId: ngo,
      referralType: ReferralType.card_purchase,
      triggerAmount: 5_500_000,
      status: ReferralStatus.pending,
      rewardForReferrer: '01 Voucher 200.000đ (hạn dùng 30 ngày)',
      rewardForReferred: '01 Túi tote Skinmaster',
      voucher: null,
    },
    {
      displayCode: 'GT-2607-098',
      referrerCustomerId: thuHa,
      referredCustomerId: vuong,
      referralType: ReferralType.card_purchase,
      triggerAmount: 5_500_000,
      status: ReferralStatus.rewarded,
      rewardForReferrer: '01 Voucher 200.000đ (hạn dùng 30 ngày)',
      rewardForReferred: '01 Túi tote Skinmaster',
      voucher: { value: 200_000, label: 'Mua thẻ dịch vụ trên 5.000.000đ' },
    },
  ];

  for (const r of referralData) {
    const existing = await prisma.referral.findUnique({ where: { displayCode: r.displayCode } });
    if (existing) continue;

    const referral = await prisma.referral.create({
      data: {
        displayCode: r.displayCode,
        referrerCustomerId: r.referrerCustomerId,
        referredCustomerId: r.referredCustomerId,
        referralType: r.referralType,
        triggerAmount: r.triggerAmount,
        status: r.status,
        rewardForReferrer: r.rewardForReferrer,
        rewardForReferred: r.rewardForReferred,
        rewardedAt: r.status === ReferralStatus.rewarded ? new Date() : null,
      },
    });

    if (r.voucher) {
      await prisma.voucher.create({
        data: {
          voucherCode: `SMV-${88000 + Math.floor(Math.random() * 999)}`,
          customerId: r.referrerCustomerId,
          value: r.voucher.value,
          sourceType: VoucherSourceType.referral,
          sourceLabel: r.voucher.label,
          referralId: referral.id,
          expiresAt: new Date('2026-09-15'),
          status: VoucherStatus.active,
        },
      });
    }
  }

  console.log(`✔ Seeded ${referralData.length} referrals (with vouchers for rewarded ones)`);

  // A couple of extra vouchers to exercise more of the lifecycle: a tier
  // bonus voucher and an already-expired one.
  const lan = await prisma.customer.findUnique({ where: { phone: '0933444555' } });
  if (lan) {
    await prisma.voucher.upsert({
      where: { voucherCode: 'SMV-87940' },
      update: {},
      create: {
        voucherCode: 'SMV-87940',
        customerId: lan.id,
        value: 1_500_000,
        sourceType: VoucherSourceType.tier_bonus,
        sourceLabel: 'Tặng thêm hạng Gold',
        expiresAt: new Date('2026-12-18'),
        status: VoucherStatus.active,
      },
    });
  }

  const huy = await prisma.customer.findUnique({ where: { phone: '0909222333' } });
  if (huy) {
    await prisma.voucher.upsert({
      where: { voucherCode: 'SMV-87990' },
      update: {},
      create: {
        voucherCode: 'SMV-87990',
        customerId: huy.id,
        value: 200_000,
        sourceType: VoucherSourceType.referral,
        sourceLabel: 'Giới thiệu — mua thẻ 5tr',
        expiresAt: new Date('2026-07-01'),
        status: VoucherStatus.expired,
      },
    });
  }
  console.log('✔ Seeded extra tier-bonus + expired vouchers');
}

async function main() {
  await seedAdmins();
  await seedTierPolicies();
  await seedReferralPolicies();
  const referrers = await seedCustomersAndCards();
  const referred = await seedReferredCustomers(referrers);
  await seedReferralsAndVouchers(referrers, referred);
  console.log('\n✅ Seed hoàn tất. Đăng nhập demo:');
  console.log('   Admin (Quản trị toàn quyền): admin@skinmaster.edu.vn / Admin@123');
  console.log('   Admin (Văn phòng):           vanphong@skinmaster.edu.vn / Operator@123');
  console.log('   Admin (Sale):                sale@skinmaster.edu.vn / Operator@123');
  console.log('   Admin (CSKH):                cskh@skinmaster.edu.vn / Operator@123');
  console.log('   User:   SĐT 0912345678 — OTP sẽ in ra log server (OTP_PROVIDER=console)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
