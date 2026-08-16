const ADMIN_TOKEN_KEY = 'sm_admin_token';
const ADMIN_USER_KEY = 'sm_admin_user';
const CUSTOMER_TOKEN_KEY = 'sm_customer_token';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'super_admin' | 'operator';
  department: string | null;
}

export const adminAuth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },
  getUser(): AdminUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  save(token: string, user: AdminUser) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  },
};

export const customerAuth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  },
  save(token: string) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  },
};
