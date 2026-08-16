'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { adminAuth, AdminUser } from '@/lib/auth-storage';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string; admin: AdminUser }>('/auth/admin/login', {
        method: 'POST',
        body: { email, password },
      });
      adminAuth.save(res.accessToken, res.admin);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#141414',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 15, letterSpacing: '.14em', fontWeight: 700, textTransform: 'uppercase' }}>
            Skinmaster
          </div>
          <div style={{ fontSize: 12, color: '#767676', marginTop: 4 }}>Loyalty — Admin</div>
        </div>

        {error && <div className="sm-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="sm-field">
            <label className="sm-label">Email</label>
            <input
              className="sm-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@skinmaster.edu.vn"
              required
            />
          </div>
          <div className="sm-field">
            <label className="sm-label">Mật khẩu</label>
            <input
              className="sm-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="sm-btn-block" type="submit" disabled={loading}>
            {loading && <span className="sm-spinner" />} Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
