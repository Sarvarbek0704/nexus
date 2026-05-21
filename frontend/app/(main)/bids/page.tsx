'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetMyBidsQuery, useWithdrawBidMutation } from '@/store/api/bidsApi';
import { useAppSelector } from '@/store';
import { formatCurrency, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { Send, Clock, DollarSign, CheckCircle, XCircle, Star, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';

const STATUS_TABS = ['all', 'pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'];

export default function BidsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState('all');

  const { data, isLoading } = useGetMyBidsQuery({
    page,
    limit: 10,
    status: activeStatus === 'all' ? undefined : activeStatus,
  });

  const [withdrawBid] = useWithdrawBidMutation();

  const bids = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  const handleWithdraw = async (bidId: string) => {
    if (!confirm('Are you sure you want to withdraw this bid?')) return;
    try {
      await withdrawBid(bidId).unwrap();
      toast.success('Bid withdrawn');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to withdraw bid');
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Bids</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track all your project bids and their status.</p>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-2 px-4 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Send className="w-4 h-4" /> Find Projects
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            onClick={() => { setActiveStatus(status); setPage(1); }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              activeStatus === status
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Bids List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
        </div>
      ) : bids.length === 0 ? (
        <div className="text-center py-20">
          <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bids found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {activeStatus === 'all' ? "You haven't submitted any bids yet." : `No ${activeStatus} bids.`}
          </p>
          <Link href="/projects" className="mt-4 inline-flex items-center gap-2 text-nexus-600 hover:underline text-sm font-medium">
            Browse projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-card transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/projects/${bid.project?.id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-nexus-600 dark:hover:text-nexus-400 transition-colors"
                      >
                        {bid.project?.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          Bid: {formatCurrency(bid.bidAmount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {bid.deliveryDays} days
                        </span>
                        <span>{formatRelativeTime(bid.createdAt)}</span>
                      </div>
                    </div>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0', getStatusColor(bid.status))}>
                      {bid.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2 leading-relaxed">
                    {bid.coverLetter}
                  </p>

                  {bid.milestones && bid.milestones.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-gray-400">{bid.milestones.length} milestones</span>
                      <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-xs text-gray-400">
                        Total: {formatCurrency(bid.milestones.reduce((sum, m) => sum + m.amount, 0))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  {bid.status === 'accepted' && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Bid accepted — contract pending
                    </div>
                  )}
                  {bid.status === 'shortlisted' && (
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-medium">
                      <Star className="w-4 h-4" />
                      You've been shortlisted!
                    </div>
                  )}
                  {bid.status === 'rejected' && (
                    <div className="flex items-center gap-1.5 text-red-500 text-sm">
                      <XCircle className="w-4 h-4" />
                      Bid was rejected
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/projects/${bid.project?.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-nexus-600 dark:text-nexus-400 border border-nexus-200 dark:border-nexus-800 rounded-lg hover:bg-nexus-50 dark:hover:bg-nexus-950/30 transition-colors"
                  >
                    View Project
                  </Link>
                  {bid.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(bid.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

