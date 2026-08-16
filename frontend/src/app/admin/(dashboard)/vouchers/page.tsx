'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { formatVnd, formatDate } from '@/lib/format';
import { useRequireAdmin } from '@/lib/hooks';
import type { Customer, Voucher } from '@/lib/types';

const SOURCE_LABEL: Record<string, string> = {
  referral: 'Giới thiệu',
  tier_bonus: 'Tặng thêm hạng thẻ',
  manual: 'Tạo thủ công',
};

export default function VouchersAdminPage() {
  const session = useRequireAdmin();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showModal, setShowModal] = useState(false);

  async function reload() {
    if (!session) return;
    setVouchers(await apiFetch<Voucher[]>('/vouchers', { token: session.token }));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Voucher &amp; Quà tặng</h2>
          <div className="sub">Voucher phát sinh từ thẻ thành viên và chương trình giới thiệu</div>
        </div>
        <div className="topbar-right">
          <button className="btn primary" onClick={() => setShowModal(true)}>
            + Tạo voucher thủ công
          </button>
        </div>
      </div>
      <div className="content">
        <div className="panel">
          <div className="panel-body">
            <table>
              <thead>
                <tr>
                  <th>Mã voucher</th>
                  <th>Khách hàng</th>
                  <th>Giá trị</th>
                  <th>Nguồn phát hành</th>
                  <th>Hạn sử dụng</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="cell-name">{v.voucherCode}</td>
                    <td>{v.customer?.fullName}</td>
                    <td>{formatVnd(v.value)}</td>
                    <td>
                      {SOURCE_LABEL[v.sourceType]} — {v.sourceLabel}
                    </td>
                    <td className="cell-sub">{formatDate(v.expiresAt)}</td>
                    <td>
                      <span
                        className={`badge ${v.status === 'active' ? 'status-done' : v.status === 'expired' ? 'status-expired' : 'status-pending'}`}
                      >
                        {v.status === 'active' ? 'Còn hiệu lực' : v.status === 'expired' ? 'Hết hạn' : 'Đã sử dụng'}
                      </span>
                    </td>
                    <td>
                      {v.status === 'active' && (
                        <button
                          className="btn ghost"
                          onClick={async () => {
                            await apiFetch(`/vouchers/${v.id}/use`, { method: 'POST', token: session.token });
                            reload();
                          }}
                        >
                          Đánh dấu đã dùng
                        </button>
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
        <CreateVoucherModal
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

function CreateVoucherModal({
  token,
  onClose,
  onSaved,
}: {
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const matches = await apiFetch<Customer[]>(`/customers?search=${encodeURIComponent(phone)}`, { token });
      const customer = matches.find((c) => c.phone === phone.replace(/\s+/g, ''));
      if (!customer) {
        throw new ApiError(404, 'Không tìm thấy khách hàng với số điện thoại này');
      }
      await apiFetch('/vouchers', {
        method: 'POST',
        token,
        body: {
          customerId: customer.id,
          value: Number(value),
          sourceLabel,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tạo voucher');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sm-modal-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Tạo voucher thủ công</h3>
        {error && <div className="sm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="sm-field">
            <label className="sm-label">SĐT khách hàng</label>
            <input className="sm-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="sm-field">
            <label className="sm-label">Mệnh giá (đ)</label>
            <input
              className="sm-input"
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          <div className="sm-field">
            <label className="sm-label">Ghi chú nguồn phát hành</label>
            <input
              className="sm-input"
              placeholder="VD: Khuyến mãi sinh nhật Skinmaster"
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              required
            />
          </div>
          <div className="sm-field">
            <label className="sm-label">Hạn sử dụng (để trống = 30 ngày kể từ hôm nay)</label>
            <input
              className="sm-input"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="sm-modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Tạo voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
