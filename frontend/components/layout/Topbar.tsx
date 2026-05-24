'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { Bell, Search, Moon, Sun, Menu, ChevronDown, Globe, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn, formatCurrency } from '@/lib/utils';
import { useI18n, useT, LANGUAGE_LABELS, Language } from '@/lib/i18n';

export function Topbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { unreadNotifications } = useAppSelector((s) => s.ui);
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearch, setMobileSearch] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const router = useRouter();
  const t = useT();
  const { lang, setLang } = useI18n();
  const langRef = useRef<HTMLDivElement>(null);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = encodeURIComponent(searchQuery.trim());
      if (pathname.startsWith('/freelancers')) {
        router.push(`/freelancers?search=${q}`);
      } else {
        router.push(`/projects?search=${q}`);
      }
      setSearchQuery('');
      setMobileSearch(false);
    }
    if (e.key === 'Escape') setMobileSearch(false);
  };

  const ROUTE_TITLES: Record<string, string> = {
    '/dashboard': t.routes.dashboard,
    '/projects': t.routes.projects,
    '/projects/post': t.routes.postProject,
    '/bids': t.routes.myBids,
    '/contracts': t.routes.contracts,
    '/freelancers': t.routes.freelancers,
    '/agencies': t.routes.agencies,
    '/messages': t.routes.messages,
    '/notifications': t.routes.notifications,
    '/payments': t.routes.payments,
    '/profile': t.routes.profile,
    '/settings': t.routes.settings,
    '/admin': t.routes.admin,
  };

  const title =
    Object.entries(ROUTE_TITLES).find(
      ([route]) => pathname === route || pathname.startsWith(route + '/')
    )?.[1] || 'Nexus';

  const searchPlaceholder = pathname.startsWith('/freelancers')
    ? t.topbar.searchFreelancers
    : t.topbar.searchProjects;

  return (
    <>
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 sm:h-16 flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hidden sm:block truncate">
          {title}
        </h1>

        {/* Desktop search */}
        <div className="flex-1 max-w-md ml-2 hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-lg focus:outline-none focus:border-nexus-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
            />
          </div>
        </div>

        {/* Mobile search button */}
        <button
          onClick={() => setMobileSearch(true)}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Balance */}
          {user && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-nexus-50 dark:bg-nexus-950 rounded-lg text-sm">
              <span className="text-gray-500 dark:text-gray-400 text-xs">{t.topbar.balance}:</span>
              <span className="font-semibold text-nexus-700 dark:text-nexus-300">
                {formatCurrency(Number(user.walletBalance))}
              </span>
            </div>
          )}

          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1.5 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t.topbar.language}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium uppercase hidden sm:block">{lang}</span>
              <ChevronDown className="w-3 h-3 hidden sm:block" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 min-w-[140px] z-50">
                {(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                      lang === l
                        ? 'bg-nexus-50 dark:bg-nexus-950 text-nexus-700 dark:text-nexus-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    <span className="text-base">{LANGUAGE_LABELS[l].flag}</span>
                    <span>{LANGUAGE_LABELS[l].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
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

          {/* Avatar */}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-nexus-100 dark:bg-nexus-900 flex items-center justify-center flex-shrink-0">
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

      {/* Mobile search overlay */}
      {mobileSearch && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex items-start pt-4 px-4 md:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-10 py-3 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-nexus-500"
            />
            <button
              onClick={() => setMobileSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
