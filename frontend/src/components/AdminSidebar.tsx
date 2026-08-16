'use client';

import { usePathname, useRouter } from 'next/navigation';
import { adminAuth, AdminUser } from '@/lib/auth-storage';

const NAV = [
  { href: '/admin', icon: '◆', label: 'Tổng quan' },
  { href: '/admin/members', icon: '◇', label: 'Thành viên & Thẻ' },
  { href: '/admin/referrals', icon: '◈', label: 'Giới thiệu bạn bè' },
  { href: '/admin/vouchers', icon: '◎', label: 'Voucher & Quà tặng' },
  { href: '/admin/policy', icon: '▤', label: 'Cấu hình chính sách' },
];

export default function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    adminAuth.clear();
    router.replace('/admin/login');
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>
          <span className="mark" />
          SKINMASTER
        </h1>
        <span>LOYALTY — ADMIN</span>
      </div>
      <nav className="nav">
        {NAV.map((item) => {
          if (item.href === '/admin/policy' && user.role !== 'super_admin') return null;
          return (
            <button
              key={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <span className="ico">{item.icon}</span> {item.label}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <strong>{user.fullName}</strong>
        {user.email}
        <div style={{ marginTop: 10 }}>
          <button className="sm-link-btn" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
