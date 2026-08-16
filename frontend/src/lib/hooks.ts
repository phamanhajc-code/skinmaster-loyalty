'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAuth, AdminUser, customerAuth } from './auth-storage';

/** Redirects to /admin/login if no admin session exists. Returns null while checking/redirecting. */
export function useRequireAdmin(): { token: string; user: AdminUser } | null {
  const router = useRouter();
  const [state, setState] = useState<{ token: string; user: AdminUser } | null | 'pending'>('pending');

  useEffect(() => {
    const token = adminAuth.getToken();
    const user = adminAuth.getUser();
    if (!token || !user) {
      router.replace('/admin/login');
      return;
    }
    setState({ token, user });
  }, [router]);

  return state === 'pending' ? null : state;
}

/** Redirects to /login if no customer session exists. Returns null while checking/redirecting. */
export function useRequireCustomer(): string | null {
  const router = useRouter();
  const [token, setToken] = useState<string | null | 'pending'>('pending');

  useEffect(() => {
    const t = customerAuth.getToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
  }, [router]);

  return token === 'pending' ? null : token;
}
