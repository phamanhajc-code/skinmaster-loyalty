'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { customerAuth } from '@/lib/auth-storage';

export default function CustomerLoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (customerAuth.getToken()) {
      router.replace('/home');
    }
  }, [router]);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/auth/otp/request', { method: 'POST', body: { phone } });
      setHint('Đã gửi mã OTP. Ở môi trường dev, mã được in ra log của server backend (chưa nối SMS/Zalo ZNS thật).');
      setStep('otp');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể gửi OTP, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string }>('/auth/otp/verify', {
        method: 'POST',
        body: { phone, code },
      });
      customerAuth.save(res.accessToken);
      router.replace('/home');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="user-shell">
      <div className="device">
        <div className="app-header">
          <div className="top-row">
            <div>
              <div className="brandline">Skinmaster Loyalty</div>
              <div className="greet">Đăng nhập thành viên</div>
            </div>
          </div>
        </div>

        <div className="section" style={{ paddingTop: 18 }}>
          <div className="referral-card" style={{ textAlign: 'left' }}>
            {error && <div className="sm-error">{error}</div>}

            {step === 'phone' ? (
              <form onSubmit={requestOtp}>
                <div className="sm-field">
                  <label className="sm-label">Số điện thoại</label>
                  <input
                    className="sm-input"
                    type="tel"
                    placeholder="09xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <div className="sm-hint">Số điện thoại đã đăng ký thẻ thành viên Skinmaster.</div>
                </div>
                <button className="sm-btn-block" type="submit" disabled={loading}>
                  {loading && <span className="sm-spinner" />} Gửi mã OTP
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp}>
                {hint && <div className="sm-hint" style={{ marginBottom: 14 }}>{hint}</div>}
                <div className="sm-field">
                  <label className="sm-label">Mã OTP (6 số)</label>
                  <input
                    className="sm-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <button className="sm-btn-block" type="submit" disabled={loading}>
                  {loading && <span className="sm-spinner" />} Xác nhận
                </button>
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <button type="button" className="sm-link-btn" onClick={() => setStep('phone')}>
                    Đổi số điện thoại
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
