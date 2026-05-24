'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetMyDisputesQuery } from '@/store/api/disputesApi';
import { formatCurrency, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { ShieldAlert, ArrowRight, Plus, Loader2, MessageSquare, Clock } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';

const STATUS_TABS = ['all', 'open', 'under_review', 'awaiting_response', 'mediation', 'escalated', 'resolved_claimant', 'resolved_respondent', 'closed'];

export default function DisputesPage() {
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState('all');

  const { data, isLoading } = useGetMyDisputesQuery({
    page,
    limit: 10,
    status: activeStatus === 'all' ? undefined : activeStatus,
  });

  const disputes = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Disputes</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track your contract disputes.</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            onClick={() => { setActiveStatus(status); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap',
              activeStatus === status
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-20">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No disputes</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">You have no active disputes. Great job!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Link
              key={dispute.id}
              href={`/disputes/${dispute.id}`}
              className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-card transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {dispute.disputeNumber}
                      </p>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', getStatusColor(dispute.status))}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{dispute.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{dispute.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="capitalize">{dispute.reason?.replace('_', ' ')}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatRelativeTime(dispute.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {(dispute as any).messagesCount ?? dispute._count?.messages ?? 0} messages
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {dispute.claimAmount && (
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(dispute.claimAmount)}</p>
                  )}
                  <span className="text-nexus-600 dark:text-nexus-400 text-xs flex items-center gap-1 mt-1">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

