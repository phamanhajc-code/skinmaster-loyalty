'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatVnd, formatDateTime } from '@/lib/format';
import { useRequireAdmin } from '@/lib/hooks';
import type { DashboardSummary, Transaction, TierDistributionItem } from '@/lib/types';

export default function AdminDashboardPage() {
  const session = useRequireAdmin();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState<TierDistributionItem[]>([]);

  useEffect(() => {
    if (!session) return;
    const { token } = session;
    (async () => {
      const [s, tx, td] = await Promise.all([
        apiFetch<DashboardSummary>('/dashboard/summary', { token }),
        apiFetch<Transaction[]>('/dashboard/recent-transactions?limit=6', { token }),
        apiFetch<TierDistributionItem[]>('/dashboard/tier-distribution', { token }),
      ]);
      setSummary(s);
      setRecentTx(tx);
      setTiers(td);
    })();
  }, [session]);

  if (!session) return null;

  const maxTierCount = Math.max(1, ...tiers.map((t) => t.count));

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Tổng quan</h2>
          <div className="sub">Skinmaster Loyalty · Cập nhật hôm nay</div>
        </div>
        <div className="topbar-right">
          <div className="avatar">SM</div>
        </div>
      </div>
      <div className="content">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Thành viên đang hoạt động</div>
            <div className="value">{summary?.activeMembers ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="label">Tổng giá trị lưu trữ trên thẻ</div>
            <div className="value">{summary ? formatVnd(summary.totalCardBalance) : '—'}</div>
          </div>
          <div className="stat-card">
            <div className="label">Giới thiệu thành công (tháng này)</div>
            <div className="value">{summary?.referralsThisMonth ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="label">Voucher sắp hết hạn (7 ngày)</div>
            <div className="value">{summary?.vouchersExpiringSoon ?? '—'}</div>
            <div className="delta">Cần nhắc khách sử dụng</div>
          </div>
        </div>

        <div className="two-col">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Giao dịch gần đây</h3>
                <div className="hint">Nạp thẻ &amp; sử dụng dịch vụ mới nhất</div>
              </div>
            </div>
            <div className="panel-body">
              <table>
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Loại</th>
                    <th>Giá trị</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((t) => (
                    <tr key={t.id}>
                      <td className="cell-name">{t.card?.customer?.fullName}</td>
                      <td>
                        {t.type === 'top_up'
                          ? `Nạp thẻ (${t.card?.tierPolicy?.displayName ?? t.card?.tierCode})`
                          : t.type === 'bonus_credit'
                            ? 'Cộng thưởng'
                            : `Sử dụng dịch vụ${t.serviceName ? ` — ${t.serviceName}` : ''}`}
                      </td>
                      <td>
                        {Number(t.amount) >= 0 ? '+' : ''}
                        {formatVnd(t.amount)}
                      </td>
                      <td className="cell-sub">{formatDateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Phân bổ theo hạng thẻ</h3>
                <div className="hint">Trên tổng {summary?.activeMembers ?? 0} thành viên</div>
              </div>
            </div>
            <div className="panel-body">
              {tiers.map((t) => (
                <div key={t.code} className="tier-bar-row">
                  <div className="tname">{t.displayName}</div>
                  <div className="tier-bar-track">
                    <div className="tier-bar-fill" style={{ width: `${(t.count / maxTierCount) * 100}%` }} />
                  </div>
                  <div className="tcount">{t.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
