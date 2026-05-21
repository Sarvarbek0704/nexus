'use client';

import { useAppSelector } from '@/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function AdminPage() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (user?.role !== 'admin') return null;

  return <AdminDashboard />;
}
