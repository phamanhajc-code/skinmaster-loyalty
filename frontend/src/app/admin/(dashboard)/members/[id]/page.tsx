'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { formatVnd, formatDate, formatDateTime } from '@/lib/format';
import { useRequireAdmin } from '@/lib/hooks';
import type { MembershipCard } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang hoạt động',
  used_up: 'Đã dùng hết',
  locked: 'Tạm khoá',
};

const TX_LABEL: Record<string, string> = {
  top_up: 'Nạp thẻ',
  bonus_credit: 'Cộng thưởng',
  usage: 'Sử dụng dịch vụ',
};

export default function MemberDetailPage() {
  const session = useRequireAdmin();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [card, setCard] = useState<MembershipCard | null>(null);
  const [modal, setModal] = useState<'topup' | 'usage' | null>(null);

  async function reload() {
    if (!session) return;
    setCard(await apiFetch<MembershipCard>(`/cards/${params.id}`, { token: session.token }));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, params.id]);

  if (!session || !card) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>{card.customer?.fullName}</h2>
          <div className="sub">
            {card.cardCode} · {card.customer?.phone}
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn" onClick={() => router.push('/admin/members')}>
            ← Quay lại
          </button>
        </div>
      </div>
      <div className="content">
        <div className="two-col">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Lịch sử giao dịch</h3>
                <div className="hint">Toàn bộ giao dịch của thẻ {card.cardCode}</div>
              </div>
            </div>
            <div className="panel-body">
              <table>
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Giá trị</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {(card.transactions ?? []).map((t) => (
                    <tr key={t.id}>
                      <td>{TX_LABEL[t.type]}{t.serviceName ? ` — ${t.serviceName}` : ''}</td>
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
                <h3>Thông tin thẻ</h3>
              </div>
            </div>
            <div className="panel-body">
              <div className="policy-card" style={{ border: 'none', padding: 0 }}>
                <div className="row">
                  <span>Hạng thẻ</span>
                  <span>{card.tierPolicy?.displayName ?? card.tierCode}</span>
                </div>
                <div className="row">
                  <span>Số dư hiện tại</span>
                  <span>{formatVnd(card.balance)}</span>
                </div>
                <div className="row">
                  <span>Dịch vụ tặng kèm</span>
                  <span>{card.bundledServiceName}</span>
                </div>
                <div className="row">
                  <span>Ngày kích hoạt</span>
                  <span>{formatDate(card.activatedAt)}</span>
                </div>
                <div className="row">
                  <span>Trạng thái</span>
                  <span>{STATUS_LABEL[card.status]}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => setModal('topup')}>
                  Nạp thêm
                </button>
                <button
                  className="btn primary"
                  style={{ flex: 1 }}
                  disabled={card.status !== 'active'}
                  onClick={() => setModal('usage')}
                >
                  Sử dụng dịch vụ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <CardActionModal
          token={session.token}
          cardId={card.id}
          mode={modal}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function CardActionModal({
  token,
  cardId,
  mode,
  onClose,
  onDone,
}: {
  token: string;
  cardId: string;
  mode: 'topup' | 'usage';
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'topup') {
        await apiFetch(`/cards/${cardId}/top-up`, { method: 'POST', token, body: { amount: Number(amount) } });
      } else {
        await apiFetch(`/cards/${cardId}/use-service`, {
          method: 'POST',
          token,
          body: { amount: Number(amount), serviceName },
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể thực hiện giao dịch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sm-modal-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'topup' ? 'Nạp thêm vào thẻ' : 'Sử dụng dịch vụ'}</h3>
        {error && <div className="sm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="sm-field">
            <label className="sm-label">Số tiền (đ)</label>
            <input
              className="sm-input"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          {mode === 'usage' && (
            <div className="sm-field">
              <label className="sm-label">Tên dịch vụ</label>
              <input
                className="sm-input"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="sm-modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
