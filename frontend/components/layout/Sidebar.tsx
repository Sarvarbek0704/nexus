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
  Plus, TrendingUp, Search, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

const getNavItems = (role: UserRole) => {
  const common = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/payments', icon: CreditCard, label: 'Payments' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const clientItems = [
    { href: '/projects/post', icon: Plus, label: 'Post Project', highlight: true },
    { href: '/projects', icon: Briefcase, label: 'Browse Projects' },
    { href: '/projects?filter=my', icon: FileText, label: 'My Projects' },
    { href: '/freelancers', icon: Users, label: 'Find Freelancers' },
    { href: '/agencies', icon: Building2, label: 'Browse Agencies' },
    { href: '/contracts', icon: FileText, label: 'Contracts' },
  ];

  const freelancerItems = [
    { href: '/projects', icon: Search, label: 'Find Work' },
    { href: '/bids', icon: FileText, label: 'My Bids' },
    { href: '/contracts', icon: Briefcase, label: 'My Contracts' },
    { href: '/profile', icon: Users, label: 'My Profile' },
    { href: '/reviews', icon: Star, label: 'Reviews' },
  ];

  const agencyItems = [
    { href: '/agencies/my', icon: Building2, label: 'My Agency', highlight: true },
    { href: '/projects', icon: Search, label: 'Find Work' },
    { href: '/bids', icon: FileText, label: 'Agency Bids' },
    { href: '/contracts', icon: Briefcase, label: 'Contracts' },
  ];

  const adminItems = [
    { href: '/admin', icon: Shield, label: 'Admin Panel', highlight: true },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/projects', icon: Briefcase, label: 'Projects' },
    { href: '/admin/disputes', icon: AlertTriangle, label: 'Disputes' },
    { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
  ];

  const roleSpecific =
    role === 'client' ? clientItems
    : role === 'freelancer' ? freelancerItems
    : role === 'agency_owner' ? agencyItems
    : adminItems;

  return {
    main: roleSpecific,
    bottom: common,
  };
};

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { sidebarOpen } = useAppSelector((s) => s.ui);

  const navItems = user ? getNavItems(user.role) : { main: [], bottom: [] };

  const handleLogout = () => {
    clearTokens();
    dispatch(logout());
    router.push('/login');
  };

  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
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
        {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
        {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-nexus-600 rounded-l-full" />}
      </Link>
    );
  };

  return (
    <>
      {!sidebarOpen && (
        <div className="hidden lg:block lg:w-16" />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-full z-30 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-nexus-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">Nexus</span>
            </Link>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 bg-nexus-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">N</span>
            </div>
          )}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className={cn(
              'p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
              !sidebarOpen && 'hidden lg:flex absolute -right-3 top-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm'
            )}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {sidebarOpen && user && (
          <Link href="/profile" className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-nexus-100 dark:bg-nexus-900 flex items-center justify-center flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-nexus-600 dark:text-nexus-400 font-semibold text-sm">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
            </div>
          </Link>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.main.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}

          {navItems.main.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
          )}

          {navItems.bottom.slice(0, 2).map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          {navItems.bottom.slice(2).map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 w-full transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
