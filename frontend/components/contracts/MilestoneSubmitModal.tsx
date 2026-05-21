'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSubmitMilestoneMutation } from '@/store/api/milestonesApi';
import { X, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const schema = z.object({
  submissionNote: z.string().min(20, 'Please provide at least 20 characters describing your work'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  milestoneId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MilestoneSubmitModal({ milestoneId, onClose, onSuccess }: Props) {
  const [submitMilestone, { isLoading }] = useSubmitMilestoneMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await submitMilestone({ milestoneId, ...data }).unwrap();
      toast.success('Work submitted for review!');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Submission failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Submit Milestone Work</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Submission Notes *
            </label>
            <textarea
              {...register('submissionNote')}
              rows={5}
              placeholder="Describe what you've completed, any decisions made, how to test/review the work, and links to deliverables..."
              className={cn(
                'w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700 resize-none',
                errors.submissionNote && 'border-red-400'
              )}
            />
            {errors.submissionNote && (
              <p className="text-xs text-red-500 mt-1">{errors.submissionNote.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Submit for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

