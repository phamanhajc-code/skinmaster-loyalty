'use client';

import AdminSidebar from '@/components/AdminSidebar';
import { useRequireAdmin } from '@/lib/hooks';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = useRequireAdmin();

  if (!session) {
    return <div className="admin-shell" />;
  }

  return (
    <div className="admin-shell">
      <AdminSidebar user={session.user} />
      <main className="main">{children}</main>
    </div>
  );
}
