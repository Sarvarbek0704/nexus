'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { clearTokens } from '@/lib/api';
import { logout } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, FileText, Users, Building2,
  MessageSquare, CreditCard, Star, AlertTriangle, Bell,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Plus, TrendingUp, Search, Shield, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { useT } from '@/lib/i18n';

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { sidebarOpen } = useAppSelector((s) => s.ui);
  const t = useT();

  const getNavItems = (role: UserRole) => {
    const common = [
      { href: '/dashboard', icon: LayoutDashboard, label: t.nav.dashboard },
      { href: '/messages', icon: MessageSquare, label: t.nav.messages },
      { href: '/notifications', icon: Bell, label: t.nav.notifications },
      { href: '/payments', icon: CreditCard, label: t.nav.payments },
      { href: '/settings', icon: Settings, label: t.nav.settings },
    ];

    const clientItems = [
      { href: '/projects/post', icon: Plus, label: t.nav.postProject, highlight: true },
      { href: '/projects', icon: Briefcase, label: t.nav.browseProjects },
      { href: '/projects/my', icon: FileText, label: t.nav.myProjects },
      { href: '/freelancers', icon: Users, label: t.nav.findFreelancers },
      { href: '/agencies', icon: Building2, label: t.nav.browseAgencies },
      { href: '/contracts', icon: FileText, label: t.nav.contracts },
    ];

    const freelancerItems = [
      { href: '/projects', icon: Search, label: t.nav.findWork },
      { href: '/bids', icon: FileText, label: t.nav.myBids },
      { href: '/contracts', icon: Briefcase, label: t.nav.myContracts },
      { href: '/profile', icon: Users, label: t.nav.myProfile },
      { href: '/reviews', icon: Star, label: t.nav.reviews },
    ];

    const agencyItems = [
      { href: '/agencies/my', icon: Building2, label: t.nav.myAgency, highlight: true },
      { href: '/projects', icon: Search, label: t.nav.findWork },
      { href: '/bids', icon: FileText, label: t.nav.agencyBids },
      { href: '/contracts', icon: Briefcase, label: t.nav.contracts },
    ];

    const adminItems = [
      { href: '/admin', icon: Shield, label: t.nav.adminPanel, highlight: true },
      { href: '/admin/users', icon: Users, label: t.nav.users },
      { href: '/admin/projects', icon: Briefcase, label: t.nav.projects },
      { href: '/admin/disputes', icon: AlertTriangle, label: t.nav.disputes },
      { href: '/admin/payments', icon: CreditCard, label: t.nav.payments },
    ];

    const roleSpecific =
      role === 'client' ? clientItems
      : role === 'freelancer' ? freelancerItems
      : role === 'agency_owner' ? agencyItems
      : adminItems;

    return { main: roleSpecific, bottom: common };
  };

  const navItems = user ? getNavItems(user.role as UserRole) : { main: [], bottom: [] };

  const handleLogout = () => {
    clearTokens();
    dispatch(logout());
    router.push('/login');
  };

  const handleNavClick = () => {
    // On mobile, close sidebar after navigation
    if (window.innerWidth < 1024) {
      dispatch(toggleSidebar());
    }
  };

  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={handleNavClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative',
          isActive
            ? 'bg-nexus-50 dark:bg-nexus-950 text-nexus-700 dark:text-nexus-300 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
          item.highlight && !isActive && 'bg-nexus-600 text-white hover:bg-nexus-700 hover:text-white',
        )}
        title={!sidebarOpen ? item.label : undefined}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', item.highlight && !isActive ? 'text-white' : '')} />
        <span className="text-sm truncate">{item.label}</span>
        {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-nexus-600 rounded-l-full" />}
      </Link>
    );
  };

  const NavItemCollapsed = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg transition-all mx-auto relative',
          isActive
            ? 'bg-nexus-50 dark:bg-nexus-950 text-nexus-700 dark:text-nexus-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
          item.highlight && !isActive && 'bg-nexus-600 text-white hover:bg-nexus-700 hover:text-white',
        )}
        title={item.label}
      >
        <Icon className={cn('w-5 h-5', item.highlight && !isActive ? 'text-white' : '')} />
        {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-nexus-600 rounded-l-full" />}
      </Link>
    );
  };

  // Mobile: full overlay drawer (always expanded)
  // Desktop: collapsible sidebar (w-64 or w-16)
  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Desktop spacer */}
      {!sidebarOpen && (
        <div className="hidden lg:block lg:w-16 flex-shrink-0" />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-full z-30 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300',
        // Mobile: slide in/out as full-width drawer
        sidebarOpen ? 'w-72 sm:w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
            <div className="w-8 h-8 bg-nexus-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className={cn('font-bold text-lg text-gray-900 dark:text-white transition-all', !sidebarOpen && 'lg:hidden')}>
              Nexus
            </span>
          </Link>

          {/* Close on mobile / collapse on desktop */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 lg:flex hidden"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expand button when collapsed (desktop only) */}
        {!sidebarOpen && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden lg:flex absolute -right-3 top-4 w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-full items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        {/* User info */}
        {user && (
          <Link
            href="/profile"
            onClick={handleNavClick}
            className={cn(
              'flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0',
              !sidebarOpen && 'lg:justify-center lg:px-2'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-nexus-100 dark:bg-nexus-900 flex items-center justify-center flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-nexus-600 dark:text-nexus-400 font-semibold text-sm">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              )}
            </div>
            <div className={cn('min-w-0', !sidebarOpen && 'lg:hidden')}>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
            </div>
          </Link>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.main.map((item) =>
            sidebarOpen
              ? <NavItem key={item.href} item={item} />
              : <NavItemCollapsed key={item.href} item={item} />
          )}

          {navItems.main.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
          )}

          {navItems.bottom.slice(0, 2).map((item) =>
            sidebarOpen
              ? <NavItem key={item.href} item={item} />
              : <NavItemCollapsed key={item.href} item={item} />
          )}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1 flex-shrink-0">
          {navItems.bottom.slice(2).map((item) =>
            sidebarOpen
              ? <NavItem key={item.href} item={item} />
              : <NavItemCollapsed key={item.href} item={item} />
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 w-full transition-colors',
              !sidebarOpen && 'lg:justify-center lg:px-0'
            )}
            title={!sidebarOpen ? t.nav.signOut : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={cn('text-sm', !sidebarOpen && 'lg:hidden')}>{t.nav.signOut}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
