'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { apiFetch } from '@/lib/api';
import { customerAuth } from '@/lib/auth-storage';
import { formatVnd, formatDateTime } from '@/lib/format';
import { useRequireCustomer } from '@/lib/hooks';
import type { Customer, MembershipCard, Transaction } from '@/lib/types';

function maskCardCode(code: string): string {
  const parts = code.split('-');
  const last = parts[parts.length - 1] ?? code;
  return `SM   ••••   ••••   ${last}`;
}

export default function HomePage() {
  const token = useRequireCustomer();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [card, setCard] = useState<MembershipCard | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [profile, tx] = await Promise.all([
          apiFetch<{ customer: Customer; primaryCard: MembershipCard | null }>('/me', { token }),
          apiFetch<Transaction[]>('/me/transactions', { token }),
        ]);
        setCustomer(profile.customer);
        setCard(profile.primaryCard);
        setRecentTx(tx.slice(0, 2));
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
        <div className="app-header">
          <div className="top-row">
            <div>
              <div className="brandline">Skinmaster Loyalty</div>
              <div className="greet">Chào, {customer?.fullName ?? '...'} 👋</div>
            </div>
            <div className="bell">
              🔔<span className="dot" />
            </div>
          </div>
        </div>

        {card ? (
          <>
            <div className="card-wrap">
              <div className="mcard">
                <div className="row1">
                  <div>
                    <div className="tier-name">{card.tierPolicy?.displayName ?? card.tierCode} Member</div>
                    <div className="card-no">{maskCardCode(card.cardCode)}</div>
                  </div>
                  <div className="chip" />
                </div>
                <div className="balance-label">Số dư khả dụng</div>
                <div className="balance">{formatVnd(card.balance)}</div>
                <div className="row2">
                  <div className="holder">{customer?.fullName.toUpperCase()}</div>
                  <div className="logo-mini">SKINMASTER</div>
                </div>
              </div>
            </div>

            <div className="gift-strip">
              <div className="ico">🎁</div>
              <div className="txt">
                <div className="t1">Ưu đãi thẻ {card.tierPolicy?.displayName ?? card.tierCode} của bạn</div>
                <div className="t2">
                  Tặng thêm {formatVnd(card.bonusValue)} + dịch vụ {card.bundledServiceName} (
                  {formatVnd(card.bundledServiceValue)})
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="section" style={{ paddingTop: 18 }}>
            <div className="referral-card">
              <div className="ref-desc">Bạn chưa có thẻ thành viên. Vui lòng liên hệ Skinmaster để được hỗ trợ.</div>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-title">
            <h3>Lịch sử giao dịch gần đây</h3>
            <button className="sm-link-btn" onClick={() => router.push('/history')}>
              Xem tất cả
            </button>
          </div>
          <div className="friend-list" style={{ padding: '2px 4px' }}>
            {recentTx.length === 0 && (
              <div className="hist-row" style={{ padding: '12px 14px' }}>
                <div className="hsub">Chưa có giao dịch nào</div>
              </div>
            )}
            {recentTx.map((t) => (
              <div key={t.id} className="hist-row" style={{ padding: '12px 14px' }}>
                <div>
                  <div className="hname">
                    {t.type === 'top_up' ? 'Nạp thẻ' : t.type === 'bonus_credit' ? 'Cộng thưởng' : `Sử dụng dịch vụ${t.serviceName ? ` — ${t.serviceName}` : ''}`}
                  </div>
                  <div className="hsub">{formatDateTime(t.createdAt)}</div>
                </div>
                <div className={`hamt ${Number(t.amount) < 0 ? 'minus' : 'plus'}`}>
                  {Number(t.amount) >= 0 ? '+' : ''}
                  {formatVnd(t.amount)}
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
