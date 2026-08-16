'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import { useRequireAdmin } from '@/lib/hooks';
import type { Customer, Referral, ReferralType } from '@/lib/types';

const TYPE_LABEL: Record<ReferralType, string> = {
  card_purchase: 'Mua thẻ dịch vụ',
  online_purchase: 'Mua sản phẩm online',
};

export default function ReferralsPage() {
  const session = useRequireAdmin();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    if (!session) return;
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('referralType', typeFilter);
    setReferrals(await apiFetch<Referral[]>(`/referrals?${params.toString()}`, { token: session.token }));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, statusFilter, typeFilter]);

  async function approve(id: string) {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/referrals/${id}/approve`, { method: 'POST', token: session.token });
      await reload();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Không thể duyệt lượt giới thiệu này');
    } finally {
      setBusyId(null);
    }
  }

  if (!session) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Giới thiệu bạn bè</h2>
          <div className="sub">Theo dõi &amp; duyệt phần thưởng chương trình &quot;Giới thiệu người thân / bạn bè&quot;</div>
        </div>
        <div className="topbar-right">
          <button className="btn primary" onClick={() => setShowModal(true)}>
            + Ghi nhận giới thiệu
          </button>
        </div>
      </div>
      <div className="content">
        <div className="panel">
          <div className="toolbar">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="rewarded">Đã phát thưởng</option>
              <option value="cancelled">Đã huỷ</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Tất cả loại</option>
              <option value="card_purchase">Mua thẻ dịch vụ</option>
              <option value="online_purchase">Mua sản phẩm online</option>
            </select>
            <div className="spacer" />
            <span className="hint">{referrals.length} lượt giới thiệu</span>
          </div>
          <div className="panel-body">
            <table>
              <thead>
                <tr>
                  <th>Mã giới thiệu</th>
                  <th>Người giới thiệu</th>
                  <th>Người được giới thiệu</th>
                  <th>Loại</th>
                  <th>Thưởng người giới thiệu</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="cell-name">{r.displayCode}</td>
                    <td>{r.referrer?.fullName}</td>
                    <td>{r.referred?.fullName}</td>
                    <td>{TYPE_LABEL[r.referralType]}</td>
                    <td>{r.rewardForReferrer ?? '—'}</td>
                    <td>
                      <span
                        className={`badge ${r.status === 'rewarded' ? 'status-done' : r.status === 'cancelled' ? 'status-expired' : 'status-pending'}`}
                      >
                        {r.status === 'rewarded' ? 'Đã phát thưởng' : r.status === 'cancelled' ? 'Đã huỷ' : 'Chờ xử lý'}
                      </span>
                    </td>
                    <td>
                      {r.status === 'pending' ? (
                        <button className="btn sm primary" disabled={busyId === r.id} onClick={() => approve(r.id)}>
                          {busyId === r.id ? 'Đang duyệt...' : 'Duyệt'}
                        </button>
                      ) : (
                        <button className="btn ghost">Xem</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <RecordReferralModal
          token={session.token}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            reload();
          }}
        />
      )}
    </>
  );
}

function RecordReferralModal({
  token,
  onClose,
  onSaved,
}: {
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [referrerPhone, setReferrerPhone] = useState('');
  const [referredFullName, setReferredFullName] = useState('');
  const [referredPhone, setReferredPhone] = useState('');
  const [referralType, setReferralType] = useState<ReferralType>('card_purchase');
  const [triggerAmount, setTriggerAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const matches = await apiFetch<Customer[]>(`/customers?search=${encodeURIComponent(referrerPhone)}`, {
        token,
      });
      const referrer = matches.find((c) => c.phone === referrerPhone.replace(/\s+/g, ''));
      if (!referrer) {
        throw new ApiError(404, 'Không tìm thấy khách hàng với số điện thoại người giới thiệu này');
      }

      await apiFetch('/referrals', {
        method: 'POST',
        token,
        body: {
          referrerCustomerId: referrer.id,
          newReferredCustomer: { fullName: referredFullName, phone: referredPhone },
          referralType,
          triggerAmount: Number(triggerAmount),
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể ghi nhận lượt giới thiệu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sm-modal-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Ghi nhận giới thiệu</h3>
        {error && <div className="sm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="sm-field">
            <label className="sm-label">SĐT người giới thiệu (đã có trong hệ thống)</label>
            <input
              className="sm-input"
              value={referrerPhone}
              onChange={(e) => setReferrerPhone(e.target.value)}
              required
            />
          </div>
          <div className="sm-field">
            <label className="sm-label">Họ tên người được giới thiệu</label>
            <input
              className="sm-input"
              value={referredFullName}
              onChange={(e) => setReferredFullName(e.target.value)}
              required
            />
          </div>
          <div className="sm-field">
            <label className="sm-label">SĐT người được giới thiệu</label>
            <input
              className="sm-input"
              value={referredPhone}
              onChange={(e) => setReferredPhone(e.target.value)}
              required
            />
          </div>
          <div className="sm-field">
            <label className="sm-label">Loại giới thiệu</label>
            <select
              className="sm-select"
              value={referralType}
              onChange={(e) => setReferralType(e.target.value as ReferralType)}
            >
              <option value="card_purchase">Mua thẻ dịch vụ</option>
              <option value="online_purchase">Mua sản phẩm online</option>
            </select>
          </div>
          <div className="sm-field">
            <label className="sm-label">Giá trị giao dịch (đ)</label>
            <input
              className="sm-input"
              type="number"
              min={0}
              value={triggerAmount}
              onChange={(e) => setTriggerAmount(e.target.value)}
              required
            />
            {triggerAmount && <div className="sm-hint">{formatVnd(Number(triggerAmount))}</div>}
          </div>
          <div className="sm-modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Ghi nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
