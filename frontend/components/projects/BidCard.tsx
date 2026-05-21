'use client';

import { useState } from 'react';
import { Bid } from '@/types';
import { useUpdateBidStatusMutation } from '@/store/api/bidsApi';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Star, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BidCardProps {
  bid: Bid;
  projectId: string;
  isOwner: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  withdrawn: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function BidCard({ bid, projectId, isOwner }: BidCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [updateBidStatus, { isLoading }] = useUpdateBidStatusMutation();

  const bidder = bid.freelancer || bid.agency;
  const name = bid.freelancer
    ? `${bid.freelancer.firstName} ${bid.freelancer.lastName}`
    : bid.agency?.name;
  const avatar = bid.freelancer?.avatar || bid.agency?.logo;
  const initials = bid.freelancer
    ? `${bid.freelancer.firstName?.[0]}${bid.freelancer.lastName?.[0]}`
    : bid.agency?.name?.[0];

  const handleAction = async (action: 'accept' | 'reject' | 'shortlist') => {
    try {
      await updateBidStatus({ id: bid.id, status: action === 'shortlist' ? 'shortlisted' : action === 'accept' ? 'accepted' : 'rejected' }).unwrap();
      toast.success(`Bid ${action}ed successfully`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Action failed');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="" className="w-11 h-11 object-cover" />
            ) : (
              <span className="text-nexus-600 dark:text-nexus-400 font-semibold text-sm">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                {bid.freelancer?.freelancerProfile && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5 text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {bid.freelancer.averageRating?.toFixed(1) ?? '0.0'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {bid.freelancer.freelancerProfile.experienceLevel} level
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(bid.bidAmount)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{bid.deliveryDays} days delivery</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_COLORS[bid.status] || 'bg-gray-100 text-gray-600')}>
                  {bid.status}
                </span>
                <span className="text-xs text-gray-400">{formatRelativeTime(bid.createdAt)}</span>
              </div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-nexus-600 dark:text-nexus-400 hover:underline"
              >
                {expanded ? 'Less' : 'More'}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{bid.coverLetter}</p>

            {bid.milestones && bid.milestones.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Milestones</p>
                <div className="space-y-2">
                  {bid.milestones.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">{m.title}</span>
                      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.durationDays}d</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(m.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isOwner && bid.status === 'pending' && (
        <div className="flex gap-2 px-5 pb-4">
          <button
            onClick={() => handleAction('shortlist')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50"
          >
            <Star className="w-3.5 h-3.5" /> Shortlist
          </button>
          <button
            onClick={() => handleAction('accept')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Accept
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

