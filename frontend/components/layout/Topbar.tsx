'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleSidebar, toggleNotificationPanel } from '@/store/slices/uiSlice';
import { Bell, Search, Moon, Sun, Menu, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn, formatCurrency } from '@/lib/utils';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/projects/post': 'Post a Project',
  '/bids': 'My Bids',
  '/contracts': 'Contracts',
  '/freelancers': 'Find Freelancers',
  '/agencies': 'Agencies',
  '/messages': 'Messages',
  '/notifications': 'Notifications',
  '/payments': 'Payments',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/admin': 'Admin Dashboard',
};

export function Topbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { unreadNotifications } = useAppSelector((s) => s.ui);
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const title = Object.entries(ROUTE_TITLES).find(
    ([route]) => pathname === route || pathname.startsWith(route + '/')
  )?.[1] || 'Nexus';

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-6 gap-4">
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden sm:block">
        {title}
      </h1>

      <div className="flex-1 max-w-md ml-4 hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, freelancers..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-lg focus:outline-none focus:border-nexus-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {user && (
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-nexus-50 dark:bg-nexus-950 rounded-lg text-sm">
            <span className="text-gray-500 dark:text-gray-400 text-xs">Balance:</span>
            <span className="font-semibold text-nexus-700 dark:text-nexus-300">
              {formatCurrency(Number(user.walletBalance))}
            </span>
          </div>
        )}

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Link>

        <Link href="/profile" className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-nexus-100 dark:bg-nexus-900 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-nexus-600 dark:text-nexus-400 font-semibold text-xs">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
          </div>
          <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
        </Link>
      </div>
    </header>
  );
}
