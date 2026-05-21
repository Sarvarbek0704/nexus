'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser, setLoading } from '@/store/slices/authSlice';
import { useGetMeQuery } from '@/store/api/authApi';
import { useGetUnreadCountQuery } from '@/store/api/notificationsApi';
import { setUnreadNotifications } from '@/store/slices/uiSlice';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAppSelector((s) => s.auth);
  const { sidebarOpen } = useAppSelector((s) => s.ui);

  const token = typeof window !== 'undefined'
    ? (Cookies.get('accessToken') || localStorage.getItem('accessToken'))
    : null;

  const { data: meData, isSuccess, isError } = useGetMeQuery(undefined, {
    skip: !token || isAuthenticated,
  });

  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000,
  });

  useEffect(() => {
    if (isSuccess && meData?.data) {
      dispatch(setUser(meData.data));
    }
    if (isError) {
      dispatch(setLoading(false));
      router.push('/login');
    }
  }, [isSuccess, isError, meData]);

  useEffect(() => {
    if (!token) {
      dispatch(setLoading(false));
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (unreadData?.data) {
      dispatch(setUnreadNotifications(unreadData.data.count));
    }
  }, [unreadData]);

  if (isLoading || (!isAuthenticated && token)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-nexus-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-nexus-600 font-bold text-2xl">N</span>
          </div>
          <Loader2 className="w-6 h-6 text-nexus-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
