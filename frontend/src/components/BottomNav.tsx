'use client';

import { usePathname, useRouter } from 'next/navigation';

const TABS = [
  { href: '/home', icon: '⌂', label: 'Trang chủ' },
  { href: '/referral', icon: '◈', label: 'Giới thiệu' },
  { href: '/vouchers', icon: '◎', label: 'Ví voucher' },
  { href: '/history', icon: '≡', label: 'Lịch sử' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.href}
          className={pathname === tab.href ? 'active' : ''}
          onClick={() => router.push(tab.href)}
        >
          <span className="ico">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
