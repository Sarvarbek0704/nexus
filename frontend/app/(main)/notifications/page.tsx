'use client';

import { useGetNotificationsQuery, useMarkAllAsReadMutation, useMarkAsReadMutation } from '@/store/api/notificationsApi';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, CheckCheck, Loader2, Briefcase, FileText, DollarSign, MessageSquare, AlertTriangle, Star } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, any> = {
  bid_received: Briefcase,
  bid_accepted: CheckCheck,
  bid_rejected: AlertTriangle,
  contract_created: FileText,
  milestone_submitted: Briefcase,
  milestone_approved: CheckCheck,
  payment_received: DollarSign,
  message: MessageSquare,
  review: Star,
  dispute: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  bid_received: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  bid_accepted: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  bid_rejected: 'bg-red-100 dark:bg-red-900/30 text-red-500',
  contract_created: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  milestone_submitted: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  milestone_approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  payment_received: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  message: 'bg-nexus-100 dark:bg-nexus-900/30 text-nexus-600 dark:text-nexus-400',
  review: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  dispute: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const { data, isLoading } = useGetNotificationsQuery({ page, limit: 20, unreadOnly: onlyUnread });
  const [markAllRead] = useMarkAllAsReadMutation();
  const [markRead] = useMarkAsReadMutation();

  const notifications = data?.data ?? [];
  const meta = data?.meta;
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">{unreadCount} unread notifications</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(e) => { setOnlyUnread(e.target.checked); setPage(1); }}
              className="accent-nexus-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Unread only</span>
          </label>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-nexus-600 dark:text-nexus-400 border border-nexus-200 dark:border-nexus-800 rounded-lg hover:bg-nexus-50 dark:hover:bg-nexus-950/30 transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No notifications</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">You're all caught up!</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Bell;
            const colorClass = TYPE_COLORS[notification.type] || 'bg-gray-100 dark:bg-gray-800 text-gray-500';

            return (
              <div
                key={notification.id}
                onClick={() => !notification.isRead && markRead(notification.id)}
                className={cn(
                  'flex items-start gap-4 p-5 cursor-pointer transition-colors',
                  !notification.isRead
                    ? 'bg-nexus-50/50 dark:bg-nexus-950/20 hover:bg-nexus-50 dark:hover:bg-nexus-950/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', !notification.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">{formatRelativeTime(notification.createdAt)}</p>
                </div>

                {!notification.isRead && (
                  <div className="w-2 h-2 bg-nexus-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {meta && (meta.totalPages ?? 1) > 1 && (
        <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

