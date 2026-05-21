'use client';

import { useState } from 'react';
import { useReviewMilestoneMutation } from '@/store/api/milestonesApi';
import { X, ThumbsUp, ThumbsDown, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  milestoneId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MilestoneReviewModal({ milestoneId, onClose, onSuccess }: Props) {
  const [action, setAction] = useState<'approve' | 'reject' | 'request_revision' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [reviewMilestone, { isLoading }] = useReviewMilestoneMutation();

  const handleSubmit = async () => {
    if (!action) return;
    if (action !== 'approve' && !feedback.trim()) {
      toast.error('Please provide feedback');
      return;
    }
    try {
      await reviewMilestone({ milestoneId, action, feedback }).unwrap();
      const messages = {
        approve: 'Milestone approved! Payment released to freelancer.',
        reject: 'Milestone rejected.',
        request_revision: 'Revision requested.',
      };
      toast.success(messages[action]);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Review failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Review Milestone</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Select your review decision:</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'approve' as const, label: 'Approve', icon: ThumbsUp, color: 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
                { value: 'request_revision' as const, label: 'Revision', icon: RotateCcw, color: 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' },
                { value: 'reject' as const, label: 'Reject', icon: ThumbsDown, color: 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAction(opt.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    action === opt.value ? opt.color : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {action && action !== 'approve' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Feedback *
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder={action === 'request_revision'
                  ? 'Describe what changes are needed...'
                  : 'Explain why you are rejecting this milestone...'}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 resize-none"
              />
            </div>
          )}

          {action === 'approve' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
              <p className="font-medium">Approving will:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-emerald-600 dark:text-emerald-400">
                <li>Release escrow payment to the freelancer</li>
                <li>Deduct the platform service fee</li>
                <li>Mark this milestone as completed</li>
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!action || isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

