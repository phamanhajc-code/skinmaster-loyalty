'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { apiFetch } from '@/lib/api';
import { customerAuth } from '@/lib/auth-storage';
import { useRequireCustomer } from '@/lib/hooks';
import type { Customer, Referral } from '@/lib/types';

export default function ReferralPage() {
  const token = useRequireCustomer();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [profile, refs] = await Promise.all([
          apiFetch<{ customer: Customer }>('/me', { token }),
          apiFetch<Referral[]>('/me/referrals', { token }),
        ]);
        setCustomer(profile.customer);
        setReferrals(refs);
      } catch {
        customerAuth.clear();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router]);

  async function copyCode() {
    if (!customer) return;
    try {
      await navigator.clipboard.writeText(customer.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  async function shareCode() {
    if (!customer) return;
    const text = `Dùng mã giới thiệu ${customer.referralCode} của mình khi mua thẻ/dịch vụ tại Skinmaster để cả hai cùng nhận ưu đãi nhé!`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled share sheet — no-op
      }
    } else {
      await copyCode();
    }
  }

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
              <div className="greet">Giới thiệu bạn bè</div>
            </div>
          </div>
        </div>

        <div className="section" style={{ paddingTop: 18 }}>
          <div className="referral-card">
            <div className="qr" />
            <div className="ref-code">{customer?.referralCode}</div>
            <div className="ref-desc">
              Chia sẻ mã hoặc mã QR này cho người thân, bạn bè. Khi họ mua thẻ dịch vụ hoặc đơn hàng online đầu tiên,
              cả hai đều nhận quà từ Skinmaster. Liên hệ tư vấn viên để biết chi tiết ưu đãi hiện hành.
            </div>
            <div className="share-row">
              <button className="btn-copy" onClick={copyCode}>
                {copied ? '✓ Đã sao chép' : '📋 Sao chép mã'}
              </button>
              <button className="btn-share" onClick={shareCode}>
                ↗ Chia sẻ ngay
              </button>
            </div>
          </div>

          <div className="section-title" style={{ marginTop: 20 }}>
            <h3>Bạn bè đã giới thiệu</h3>
          </div>
          <div className="friend-list">
            {referrals.length === 0 && (
              <div className="friend-row">
                <div className="fsub">Bạn chưa giới thiệu ai. Chia sẻ mã ngay để nhận ưu đãi!</div>
              </div>
            )}
            {referrals.map((r) => (
              <div key={r.id} className="friend-row">
                <div>
                  <div className="fname">{r.referred?.fullName}</div>
                  <div className="fsub">
                    {r.referralType === 'card_purchase' ? 'Mua thẻ dịch vụ' : 'Mua sản phẩm online'}
                  </div>
                </div>
                <span className={`pill ${r.status === 'rewarded' ? 'done' : 'pending'}`}>
                  {r.status === 'rewarded' ? 'Đã nhận quà' : r.status === 'cancelled' ? 'Đã huỷ' : 'Chờ xử lý'}
                </span>
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
