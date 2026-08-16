'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import { useRequireAdmin } from '@/lib/hooks';
import type { ReferralPolicyTier, ReferralType, TierPolicy } from '@/lib/types';

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function PolicyPage() {
  const session = useRequireAdmin();
  const readOnly = session?.user.role !== 'super_admin';

  const [tiers, setTiers] = useState<TierPolicy[]>([]);
  const [referralTiers, setReferralTiers] = useState<ReferralPolicyTier[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const [t, rt] = await Promise.all([
        apiFetch<TierPolicy[]>('/policy/tiers', { token: session.token }),
        apiFetch<ReferralPolicyTier[]>('/policy/referral-tiers', { token: session.token }),
      ]);
      setTiers(t);
      setReferralTiers(rt);
    })();
  }, [session]);

  if (!session) return null;

  function updateTier(index: number, patch: Partial<TierPolicy>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTier() {
    const displayName = `Hạng mới ${tiers.length + 1}`;
    setTiers((prev) => [
      ...prev,
      {
        code: slugify(displayName) || `tier_${prev.length + 1}`,
        displayName,
        minTopupValue: '0',
        bonusValue: '0',
        bundledServiceName: '',
        bundledServiceValue: '0',
        sortOrder: prev.length + 1,
        active: true,
      },
    ]);
  }

  function updateReferralTier(index: number, patch: Partial<ReferralPolicyTier>) {
    setReferralTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addReferralTier(referralType: ReferralType) {
    setReferralTiers((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${prev.length}`,
        referralType,
        label: 'Mức mới',
        minTriggerAmount: '0',
        rewardForReferred: '',
        rewardForReferrer: '',
        referrerVoucherAmounts: [],
        voucherValidityDays: 30,
        sortOrder: prev.filter((t) => t.referralType === referralType).length + 1,
        active: true,
      },
    ]);
  }

  async function saveAll() {
    if (!session) return;
    setError(null);
    setSavedMsg(null);
    setSaving(true);
    try {
      await apiFetch('/policy/tiers', {
        method: 'PUT',
        token: session.token,
        body: {
          tiers: tiers.map((t) => ({
            code: t.code,
            displayName: t.displayName,
            minTopupValue: Number(t.minTopupValue),
            bonusValue: Number(t.bonusValue),
            bundledServiceName: t.bundledServiceName,
            bundledServiceValue: Number(t.bundledServiceValue),
            sortOrder: t.sortOrder,
            active: t.active,
          })),
        },
      });
      await apiFetch('/policy/referral-tiers', {
        method: 'PUT',
        token: session.token,
        body: {
          tiers: referralTiers.map((t) => ({
            referralType: t.referralType,
            label: t.label,
            minTriggerAmount: Number(t.minTriggerAmount),
            rewardForReferred: t.rewardForReferred,
            rewardForReferrer: t.rewardForReferrer,
            referrerVoucherAmounts: t.referrerVoucherAmounts,
            voucherValidityDays: t.voucherValidityDays,
            sortOrder: t.sortOrder,
            active: t.active,
          })),
        },
      });
      setSavedMsg('Đã lưu thay đổi. Áp dụng cho các thẻ/giới thiệu phát sinh sau thời điểm này.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  }

  const cardPurchaseTiers = referralTiers.filter((t) => t.referralType === 'card_purchase');
  const onlinePurchaseTiers = referralTiers.filter((t) => t.referralType === 'online_purchase');

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Cấu hình chính sách</h2>
          <div className="sub">Hạng thẻ, mức tặng thêm &amp; phần thưởng giới thiệu — áp dụng cho toàn hệ thống</div>
        </div>
        <div className="topbar-right">
          <button className="btn primary" onClick={saveAll} disabled={saving || readOnly}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
      <div className="content">
        {readOnly && (
          <div className="sm-error" style={{ background: '#f1f1f1', color: '#454545', borderColor: '#c7c7c7' }}>
            Tài khoản Nhân viên vận hành chỉ có thể xem, không thể chỉnh sửa cấu hình chính sách. Liên hệ Quản trị
            toàn quyền để thay đổi.
          </div>
        )}
        {error && <div className="sm-error">{error}</div>}
        {savedMsg && (
          <div className="sm-hint" style={{ marginBottom: 16 }}>
            {savedMsg}
          </div>
        )}

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Hạng thẻ trị giá</h3>
              <div className="hint">Chương trình tri ân khách hàng thân thiết — theo mức nạp thẻ</div>
            </div>
            {!readOnly && (
              <button className="btn sm" onClick={addTier}>
                + Thêm hạng thẻ
              </button>
            )}
          </div>
          <div className="panel-body">
            <div className="policy-grid" style={{ marginTop: 10 }}>
              {tiers.map((t, i) => (
                <div className={`policy-card ${!t.active ? '' : ''}`} key={t.code}>
                  <input
                    className="sm-input"
                    style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}
                    value={t.displayName}
                    disabled={readOnly}
                    onChange={(e) => updateTier(i, { displayName: e.target.value })}
                  />
                  <div className="row">
                    <span>Giá trị nạp</span>
                    <input
                      className="sm-input"
                      style={{ width: 130, textAlign: 'right' }}
                      type="number"
                      disabled={readOnly}
                      value={t.minTopupValue}
                      onChange={(e) => updateTier(i, { minTopupValue: e.target.value })}
                    />
                  </div>
                  <div className="row">
                    <span>Tặng thêm</span>
                    <input
                      className="sm-input"
                      style={{ width: 130, textAlign: 'right' }}
                      type="number"
                      disabled={readOnly}
                      value={t.bonusValue}
                      onChange={(e) => updateTier(i, { bonusValue: e.target.value })}
                    />
                  </div>
                  <div className="row">
                    <span>Dịch vụ tặng kèm</span>
                    <input
                      className="sm-input"
                      style={{ width: 130, textAlign: 'right' }}
                      disabled={readOnly}
                      value={t.bundledServiceName}
                      onChange={(e) => updateTier(i, { bundledServiceName: e.target.value })}
                    />
                  </div>
                  <div className="row">
                    <span>Giá trị dịch vụ</span>
                    <input
                      className="sm-input"
                      style={{ width: 130, textAlign: 'right' }}
                      type="number"
                      disabled={readOnly}
                      value={t.bundledServiceValue}
                      onChange={(e) => updateTier(i, { bundledServiceValue: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="footnote">
              * Tên hạng thẻ là đề xuất đặt tên, có thể đổi lại theo thương hiệu. Thay đổi chỉ áp dụng cho thẻ phát
              hành sau thời điểm lưu — không hồi tố các thẻ đã phát hành trước đó.
            </div>
          </div>
        </div>

        <ReferralPolicyTable
          title="Phần thưởng giới thiệu — Mua thẻ dịch vụ"
          tiers={cardPurchaseTiers}
          allTiers={referralTiers}
          setAllTiers={setReferralTiers}
          readOnly={readOnly}
          onAdd={() => addReferralTier('card_purchase')}
          updateReferralTier={updateReferralTier}
        />
        <ReferralPolicyTable
          title="Phần thưởng giới thiệu — Mua sản phẩm online"
          tiers={onlinePurchaseTiers}
          allTiers={referralTiers}
          setAllTiers={setReferralTiers}
          readOnly={readOnly}
          onAdd={() => addReferralTier('online_purchase')}
          updateReferralTier={updateReferralTier}
        />
      </div>
    </>
  );
}

function ReferralPolicyTable({
  title,
  tiers,
  allTiers,
  updateReferralTier,
  readOnly,
  onAdd,
}: {
  title: string;
  tiers: ReferralPolicyTier[];
  allTiers: ReferralPolicyTier[];
  setAllTiers: (v: ReferralPolicyTier[]) => void;
  readOnly: boolean;
  onAdd: () => void;
  updateReferralTier: (index: number, patch: Partial<ReferralPolicyTier>) => void;
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
        </div>
        {!readOnly && (
          <button className="btn sm" onClick={onAdd}>
            + Thêm mức
          </button>
        )}
      </div>
      <div className="panel-body">
        <table>
          <thead>
            <tr>
              <th>Điều kiện</th>
              <th>Ngưỡng giá trị</th>
              <th>Quà người được giới thiệu</th>
              <th>Quà người giới thiệu</th>
              <th>Voucher tự sinh (đ, phẩy)</th>
              <th>Hạn (ngày)</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => {
              const globalIndex = allTiers.findIndex((x) => x.id === t.id);
              return (
                <tr key={t.id}>
                  <td>
                    <input
                      className="sm-input"
                      disabled={readOnly}
                      value={t.label}
                      onChange={(e) => updateReferralTier(globalIndex, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="sm-input"
                      type="number"
                      disabled={readOnly}
                      value={t.minTriggerAmount}
                      onChange={(e) => updateReferralTier(globalIndex, { minTriggerAmount: e.target.value })}
                    />
                    {t.minTriggerAmount && (
                      <div className="cell-sub">{formatVnd(Number(t.minTriggerAmount))}</div>
                    )}
                  </td>
                  <td>
                    <input
                      className="sm-input"
                      disabled={readOnly}
                      value={t.rewardForReferred}
                      onChange={(e) => updateReferralTier(globalIndex, { rewardForReferred: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="sm-input"
                      disabled={readOnly}
                      value={t.rewardForReferrer}
                      onChange={(e) => updateReferralTier(globalIndex, { rewardForReferrer: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="sm-input"
                      disabled={readOnly}
                      value={t.referrerVoucherAmounts.join(',')}
                      onChange={(e) =>
                        updateReferralTier(globalIndex, {
                          referrerVoucherAmounts: e.target.value
                            .split(',')
                            .map((s) => Number(s.trim()))
                            .filter((n) => !Number.isNaN(n) && n > 0),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="sm-input"
                      type="number"
                      style={{ width: 70 }}
                      disabled={readOnly}
                      value={t.voucherValidityDays}
                      onChange={(e) =>
                        updateReferralTier(globalIndex, { voucherValidityDays: Number(e.target.value) })
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
