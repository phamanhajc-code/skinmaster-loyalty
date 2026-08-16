'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { apiFetch } from '@/lib/api';
import { customerAuth } from '@/lib/auth-storage';
import { formatVnd, formatDateTime } from '@/lib/format';
import { useRequireCustomer } from '@/lib/hooks';
import type { Transaction, Voucher } from '@/lib/types';

interface HistoryRow {
  id: string;
  date: string;
  name: string;
  sub: string;
  amount: number;
  suffix?: string;
}

const VOUCHER_EVENT_NAME: Record<string, string> = {
  referral: 'Nhận thưởng giới thiệu',
  tier_bonus: 'Nhận ưu đãi thẻ',
  manual: 'Nhận voucher',
};

export default function HistoryPage() {
  const token = useRequireCustomer();
  const router = useRouter();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [transactions, vouchers] = await Promise.all([
          apiFetch<Transaction[]>('/me/transactions', { token }),
          apiFetch<Voucher[]>('/me/vouchers', { token }),
        ]);

        const txRows: HistoryRow[] = transactions.map((t) => ({
          id: `tx-${t.id}`,
          date: t.createdAt,
          name:
            t.type === 'top_up' ? 'Nạp thẻ' : t.type === 'bonus_credit' ? 'Cộng thưởng nạp thẻ' : `Sử dụng dịch vụ${t.serviceName ? ` — ${t.serviceName}` : ''}`,
          sub: formatDateTime(t.createdAt),
          amount: Number(t.amount),
        }));

        const voucherRows: HistoryRow[] = vouchers.map((v) => ({
          id: `v-${v.id}`,
          date: v.issuedAt,
          name: VOUCHER_EVENT_NAME[v.sourceType] ?? 'Nhận voucher',
          sub: formatDateTime(v.issuedAt),
          amount: Number(v.value),
          suffix: ' (voucher)',
        }));

        setRows([...txRows, ...voucherRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
              <div className="greet">Lịch sử giao dịch</div>
            </div>
          </div>
        </div>

        <div className="section" style={{ paddingTop: 18 }}>
          <div className="friend-list" style={{ padding: '2px 4px' }}>
            {rows.length === 0 && (
              <div className="hist-row" style={{ padding: '13px 14px' }}>
                <div className="hsub">Chưa có giao dịch nào</div>
              </div>
            )}
            {rows.map((r) => (
              <div key={r.id} className="hist-row" style={{ padding: '13px 14px' }}>
                <div>
                  <div className="hname">{r.name}</div>
                  <div className="hsub">{r.sub}</div>
                </div>
                <div className={`hamt ${r.amount < 0 ? 'minus' : 'plus'}`}>
                  {r.amount >= 0 ? '+' : ''}
                  {formatVnd(r.amount)}
                  {r.suffix ?? ''}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pad-bottom" />

        <BottomNav />
      </div>
    </div>
  );
}
