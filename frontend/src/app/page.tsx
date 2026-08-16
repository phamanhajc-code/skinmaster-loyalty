'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customerAuth } from '@/lib/auth-storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(customerAuth.getToken() ? '/home' : '/login');
  }, [router]);

  return null;
}
