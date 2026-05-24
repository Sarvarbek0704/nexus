'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useCreateDisputeMutation } from '@/store/api/disputesApi';
import { toast } from 'sonner';
import { ChevronLeft, Loader2, ShieldAlert } from 'lucide-react';

const REASONS = [
  { value: 'non_delivery', label: 'Non-delivery of work' },
  { value: 'poor_quality', label: 'Poor quality of work' },
  { value: 'scope_change', label: 'Unauthorized scope change' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'communication', label: 'Communication breakdown' },
  { value: 'deadline_missed', label: 'Deadline missed' },
  { value: 'contract_violation', label: 'Contract violation' },
  { value: 'other', label: 'Other' },
];

export default function NewDisputePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId');

  const [createDispute, { isLoading }] = useCreateDisputeMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { contractId: contractId ?? '' },
  });

  const onSubmit = async (values: any) => {
    try {
      const result = await createDispute({
        contractId: values.contractId,
        reason: values.reason,
        title: values.title,
        description: values.description,
        claimAmount: values.claimAmount ? parseFloat(values.claimAmount) : undefined,
      }).unwrap();
      toast.success('Dispute opened successfully');
      router.push(`/disputes/${result.data?.id ?? result.id}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to open dispute');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/disputes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Disputes
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Open a Dispute</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Describe the issue with your contract</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>Before opening a dispute:</strong> Try resolving the issue directly with the other party via messages. Disputes can take time to resolve and may affect your reputation.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <input type="hidden" {...register('contractId', { required: true })} />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Dispute Title <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title', { required: 'Title is required', minLength: { value: 10, message: 'At least 10 characters' } })}
            placeholder="Brief summary of the issue"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>
          <select
            {...register('reason', { required: 'Please select a reason' })}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select a reason...</option>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description', { required: 'Description is required', minLength: { value: 50, message: 'At least 50 characters' } })}
            rows={6}
            placeholder="Describe the issue in detail. Include dates, communication history, and any evidence of the problem..."
            className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 resize-none"
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Claimed Amount (optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              {...register('claimAmount')}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">The amount you are claiming compensation for, if applicable.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading || !contractId}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Open Dispute
          </button>
          <Link
            href="/disputes"
            className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
        </div>

        {!contractId && (
          <p className="text-xs text-red-500">No contract ID provided. Please navigate here from a contract page.</p>
        )}
      </form>
    </div>
  );
}
