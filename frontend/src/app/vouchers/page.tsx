'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { apiFetch } from '@/lib/api';
import { customerAuth } from '@/lib/auth-storage';
import { formatVnd, formatDate } from '@/lib/format';
import { useRequireCustomer } from '@/lib/hooks';
import type { Voucher } from '@/lib/types';

const SOURCE_LABEL: Record<string, string> = {
  referral: 'Giới thiệu',
  tier_bonus: 'Ưu đãi nạp thẻ',
  manual: 'Skinmaster tặng',
};

export default function VouchersPage() {
  const token = useRequireCustomer();
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setVouchers(await apiFetch<Voucher[]>('/me/vouchers', { token }));
      } catch {
        customerAuth.clear();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router]);

  if (!token || loading) {
    return (
      <div className="user-shell">
        <div className="device" />
      </div>
    );
  }

  return (
    <div className="user-shell">
      <div className="device">
        <div className="app-header" style={{ borderRadius: '0 0 26px 26px', paddingBottom: 26 }}>
          <div className="top-row">
            <div>
              <div className="brandline">Skinmaster Loyalty</div>
              <div className="greet">Ví voucher của tôi</div>
            </div>
          </div>
        </div>

        <div className="section" style={{ paddingTop: 18 }}>
          {vouchers.length === 0 && <div className="ref-desc">Bạn chưa có voucher nào.</div>}
          {vouchers.map((v) => (
            <div key={v.id} className={`voucher-card ${v.status !== 'active' ? 'dim' : ''}`}>
              <div className="vleft">
                <div className="amt">{formatVnd(v.value)}</div>
              </div>
              <div className="vright">
                <div className="vname">Voucher dịch vụ Skinmaster</div>
                <div className="vsource">
                  Nguồn: {SOURCE_LABEL[v.sourceType] ?? v.sourceType} — {v.sourceLabel}
                </div>
                <div className="vexpiry">
                  {v.status === 'used'
                    ? `Đã sử dụng — ${v.usedAt ? formatDate(v.usedAt) : ''}`
                    : v.status === 'expired'
                      ? `Đã hết hạn — ${formatDate(v.expiresAt)}`
                      : `Hạn dùng: ${formatDate(v.expiresAt)}`}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="pad-bottom" />

        <BottomNav />
      </div>
    </div>
  );
}
