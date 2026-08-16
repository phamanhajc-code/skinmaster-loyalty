'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { formatVnd, formatDate } from '@/lib/format';
import { useRequireAdmin } from '@/lib/hooks';
import type { MembershipCard, TierPolicy } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang hoạt động',
  used_up: 'Đã dùng hết',
  locked: 'Tạm khoá',
};

export default function MembersPage() {
  const session = useRequireAdmin();
  const router = useRouter();
  const [cards, setCards] = useState<MembershipCard[]>([]);
  const [tiers, setTiers] = useState<TierPolicy[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);

  async function reload() {
    if (!session) return;
    const { token } = session;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tierFilter) params.set('tierCode', tierFilter);
    const [cardList, tierList] = await Promise.all([
      apiFetch<MembershipCard[]>(`/cards?${params.toString()}`, { token }),
      tiers.length ? Promise.resolve(tiers) : apiFetch<TierPolicy[]>('/policy/tiers', { token }),
    ]);
    setCards(cardList);
    if (!tiers.length) setTiers(tierList);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, search, tierFilter]);

  if (!session) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Thành viên &amp; Thẻ</h2>
          <div className="sub">Quản lý khách hàng sở hữu thẻ thành viên Skinmaster Loyalty</div>
        </div>
        <div className="topbar-right">
          <button className="btn primary" onClick={() => setShowIssueModal(true)}>
            + Phát hành thẻ mới
          </button>
        </div>
      </div>
      <div className="content">
        <div className="panel">
          <div className="toolbar">
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, mã thẻ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
              <option value="">Tất cả hạng thẻ</option>
              {tiers.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.displayName}
                </option>
              ))}
            </select>
            <div className="spacer" />
            <span className="hint">{cards.length} thành viên</span>
          </div>
          <div className="panel-body">
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Mã thẻ</th>
                  <th>Hạng thẻ</th>
                  <th>Số dư hiện tại</th>
                  <th>Dịch vụ tặng kèm</th>
                  <th>Ngày kích hoạt</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-name">{c.customer?.fullName}</div>
                      <div className="cell-sub">{c.customer?.phone}</div>
                    </td>
                    <td>{c.cardCode}</td>
                    <td>
                      <span className={`badge ${c.tierCode}`}>{c.tierPolicy?.displayName ?? c.tierCode}</span>
                    </td>
                    <td>{formatVnd(c.balance)}</td>
                    <td>{c.bundledServiceName}</td>
                    <td className="cell-sub">{formatDate(c.activatedAt)}</td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'status-done' : 'status-pending'}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td>
                      <button className="btn ghost" onClick={() => router.push(`/admin/members/${c.id}`)}>
                        Chi tiết →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showIssueModal && (
        <IssueCardModal
          token={session.token}
          tiers={tiers}
          onClose={() => setShowIssueModal(false)}
          onIssued={() => {
            setShowIssueModal(false);
            reload();
          }}
        />
      )}
    </>
  );
}

function IssueCardModal({
  token,
  tiers,
  onClose,
  onIssued,
}: {
  token: string;
  tiers: TierPolicy[];
  onClose: () => void;
  onIssued: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tierCode, setTierCode] = useState(tiers[0]?.code ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/cards', {
        method: 'POST',
        token,
        body: { tierCode, newCustomer: { fullName, phone, email: email || undefined } },
      });
      onIssued();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể phát hành thẻ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sm-modal-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Phát hành thẻ mới</h3>
        {error && <div className="sm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="sm-field">
            <label className="sm-label">Họ tên khách hàng</label>
            <input className="sm-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="sm-field">
            <label className="sm-label">Số điện thoại</label>
            <input className="sm-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="sm-field">
            <label className="sm-label">Email (không bắt buộc)</label>
            <input className="sm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="sm-field">
            <label className="sm-label">Hạng thẻ</label>
            <select className="sm-select" value={tierCode} onChange={(e) => setTierCode(e.target.value)} required>
              {tiers.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.displayName} — nạp {formatVnd(t.minTopupValue)}, tặng {formatVnd(t.bonusValue)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm-modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Phát hành thẻ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
