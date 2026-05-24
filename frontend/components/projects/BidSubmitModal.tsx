'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateBidMutation } from '@/store/api/bidsApi';
import { Project } from '@/types';
import { X, Plus, Trash2, Loader2, DollarSign, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const milestoneSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive'),
  durationDays: z.coerce.number().int().positive('Duration required'),
});

const bidSchema = z.object({
  bidAmount: z.coerce.number().positive('Bid amount required'),
  deliveryDays: z.coerce.number().int().positive('Delivery time required'),
  coverLetter: z.string().min(100, 'Cover letter must be at least 100 characters').max(2000),
  milestones: z.array(milestoneSchema).optional(),
});

type BidForm = z.infer<typeof bidSchema>;

interface BidSubmitModalProps {
  project: Project;
  onClose: () => void;
}

export function BidSubmitModal({ project, onClose }: BidSubmitModalProps) {
  const [createBid, { isLoading }] = useCreateBidMutation();
  const [useMilestones, setUseMilestones] = useState(project.type === 'fixed');
  const t = useT();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<BidForm>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      milestones: project.type === 'fixed' ? [{ title: '', amount: 0, durationDays: 7 }] : [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'milestones' });
  const milestones = watch('milestones') ?? [];
  const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const onSubmit = async (data: BidForm) => {
    try {
      await createBid({
        projectId: project.id,
        amount: data.bidAmount,
        deliveryTime: data.deliveryDays,
        deliveryUnit: 'days',
        coverLetter: data.coverLetter,
        milestones: useMilestones
          ? data.milestones?.map((m) => ({
              title: m.title,
              description: m.description,
              amount: m.amount,
            }))
          : undefined,
      }).unwrap();
      toast.success('Bid submitted successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to submit bid');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.bid.submitTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">{project.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Budget & Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.bid.amount}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('bidAmount')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={cn(
                    'w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700 transition-all',
                    errors.bidAmount && 'border-red-400'
                  )}
                />
              </div>
              {errors.bidAmount && <p className="text-xs text-red-500 mt-1">{errors.bidAmount.message}</p>}
              <p className="text-xs text-gray-400 mt-1">
                {t.bid.clientBudget}: ${project.budgetMin}{project.budgetMax ? ` – $${project.budgetMax}` : ''}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.bid.delivery}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('deliveryDays')}
                  type="number"
                  placeholder="7"
                  className={cn(
                    'w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700 transition-all',
                    errors.deliveryDays && 'border-red-400'
                  )}
                />
              </div>
              {errors.deliveryDays && <p className="text-xs text-red-500 mt-1">{errors.deliveryDays.message}</p>}
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t.bid.coverLetter}
            </label>
            <textarea
              {...register('coverLetter')}
              rows={6}
              placeholder={t.bid.coverPlaceholder}
              className={cn(
                'w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700 resize-none transition-all',
                errors.coverLetter && 'border-red-400'
              )}
            />
            {errors.coverLetter && <p className="text-xs text-red-500 mt-1">{errors.coverLetter.message}</p>}
          </div>

          {/* Milestones */}
          {project.type === 'fixed' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.bid.milestones}</h3>
                  <p className="text-xs text-gray-400">{t.bid.milestonesSub}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMilestones}
                    onChange={(e) => setUseMilestones(e.target.checked)}
                    className="accent-nexus-600"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{t.bid.includeMilestones}</span>
                </label>
              </div>

              {useMilestones && (
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Milestone {idx + 1}
                        </span>
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3">
                          <input
                            {...register(`milestones.${idx}.title`)}
                            placeholder="Milestone title"
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            {...register(`milestones.${idx}.description`)}
                            placeholder="Description (optional)"
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <input
                            {...register(`milestones.${idx}.amount`)}
                            type="number"
                            step="0.01"
                            placeholder="Amount ($)"
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <input
                            {...register(`milestones.${idx}.durationDays`)}
                            type="number"
                            placeholder="Days"
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => append({ title: '', amount: 0, durationDays: 7 })}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-500 hover:border-nexus-400 hover:text-nexus-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t.bid.addMilestone}
                  </button>

                  {totalMilestoneAmount > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-nexus-50 dark:bg-nexus-950/30 rounded-lg text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t.bid.totalMilestone}</span>
                      <span className="font-bold text-nexus-600 dark:text-nexus-400">${totalMilestoneAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {t.bid.cancel}
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t.bid.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

