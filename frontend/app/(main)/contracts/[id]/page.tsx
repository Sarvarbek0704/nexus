'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  useGetContractQuery,
  useSignContractMutation,
  useFundEscrowMutation,
  useUpdateContractStatusMutation,
} from '@/store/api/contractsApi';
import { useGetMilestonesQuery, useSubmitMilestoneMutation, useReviewMilestoneMutation, useFundMilestoneEscrowMutation } from '@/store/api/milestonesApi';
import { useAppSelector } from '@/store';
import { formatCurrency, formatDate, formatRelativeTime, getStatusColor } from '@/lib/utils';
import {
  ChevronLeft, FileText, DollarSign, Calendar, Users, Shield,
  CheckCircle, AlertTriangle, Clock, Loader2, PenLine, Pause, Play,
  Lock, Upload, ThumbsUp, ThumbsDown, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MilestoneSubmitModal } from '@/components/contracts/MilestoneSubmitModal';
import { MilestoneReviewModal } from '@/components/contracts/MilestoneReviewModal';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((s) => s.auth);
  const [submitingMilestoneId, setSubmittingMilestoneId] = useState<string | null>(null);
  const [reviewingMilestoneId, setReviewingMilestoneId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetContractQuery(id);
  const { data: milestonesData, refetch: refetchMilestones } = useGetMilestonesQuery(id);

  const [signContract, { isLoading: signing }] = useSignContractMutation();
  const [fundEscrow, { isLoading: funding }] = useFundEscrowMutation();
  const [updateContractStatus] = useUpdateContractStatusMutation();
  const [fundMilestone, { isLoading: fundingMilestone }] = useFundMilestoneEscrowMutation();

  const contract = data?.data;
  const milestones = milestonesData?.data ?? [];
  const isClient = user?.id === contract?.client?.id;
  const isFreelancer = user?.id === contract?.freelancer?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-gray-900 dark:text-white font-semibold">Contract not found</p>
        <Link href="/contracts" className="text-nexus-600 hover:underline">Back to contracts</Link>
      </div>
    );
  }

  const handleSign = async () => {
    try {
      await signContract(id).unwrap();
      toast.success('Contract signed!');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to sign');
    }
  };

  const handleFundEscrow = async () => {
    try {
      await fundEscrow({ contractId: id, amount: contract.totalAmount }).unwrap();
      toast.success('Escrow funded successfully!');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to fund escrow');
    }
  };

  const handleFundMilestone = async (milestoneId: string) => {
    try {
      await fundMilestone({ contractId: id, milestoneId }).unwrap();
      toast.success('Milestone escrow funded!');
      refetchMilestones();
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to fund milestone');
    }
  };

  const needsClientSignature = isClient && !contract.clientSignedAt;
  const needsFreelancerSignature = isFreelancer && !contract.freelancerSignedAt;
  const canFundEscrow = isClient && contract.status === 'active' && !contract.escrowFunded;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link href="/contracts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Contracts
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-mono text-sm font-semibold text-gray-500 dark:text-gray-400">{contract.contractNumber}</p>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', getStatusColor(contract.status))}>
                    {contract.status}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{contract.project?.title}</h1>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white flex-shrink-0">{formatCurrency(contract.totalAmount)}</p>
            </div>

            {/* Signature Status */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {[
                { label: 'Client', signed: !!contract.clientSignedAt, date: contract.clientSignedAt },
                { label: 'Freelancer', signed: !!contract.freelancerSignedAt, date: contract.freelancerSignedAt },
              ].map((party) => (
                <div key={party.label} className="flex items-center gap-2">
                  {party.signed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{party.label}</p>
                    <p className="text-xs text-gray-400">
                      {party.signed ? `Signed ${formatDate(party.date!)}` : 'Pending signature'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              {(needsClientSignature || needsFreelancerSignature) && (
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                  Sign Contract
                </button>
              )}
              {canFundEscrow && (
                <button
                  onClick={handleFundEscrow}
                  disabled={funding}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {funding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Fund Escrow ({formatCurrency(contract.totalAmount)})
                </button>
              )}
              {contract.status === 'active' && isClient && (
                <button
                  onClick={async () => { await updateContractStatus({ id, status: 'paused' }); toast.success('Pause requested'); refetch(); }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Pause className="w-4 h-4" /> Pause Contract
                </button>
              )}
              {contract.status === 'paused' && isClient && (
                <button
                  onClick={async () => { await updateContractStatus({ id, status: 'active' }); toast.success('Contract resumed'); refetch(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Play className="w-4 h-4" /> Resume Contract
                </button>
              )}
              <Link
                href={`/disputes/new?contractId=${id}`}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" /> Open Dispute
              </Link>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Milestones</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {milestones.filter((m) => m.status === 'paid').length}/{milestones.length} completed
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {milestones.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No milestones defined.</p>
              )}
              {milestones.map((milestone, idx) => (
                <div key={milestone.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      milestone.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      milestone.status === 'submitted' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      milestone.status === 'in_progress' ? 'bg-nexus-100 text-nexus-600 dark:bg-nexus-900/30 dark:text-nexus-400' :
                      'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    )}>
                      {milestone.status === 'paid' ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{milestone.title}</p>
                          {milestone.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{milestone.description}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(milestone.amount)}</p>
                          <span className={cn('text-xs font-medium capitalize', getStatusColor(milestone.status))}>
                            {milestone.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        {/* Freelancer actions */}
                        {isFreelancer && (milestone.status === 'in_progress' || milestone.status === 'revision_requested') && (
                          <button
                            onClick={() => setSubmittingMilestoneId(milestone.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" /> Submit Work
                          </button>
                        )}
                        {isFreelancer && milestone.status === 'pending' && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Waiting for escrow funding
                          </span>
                        )}

                        {/* Client actions */}
                        {isClient && milestone.status === 'pending' && !milestone.isEscrowFunded && (
                          <button
                            onClick={() => handleFundMilestone(milestone.id)}
                            disabled={fundingMilestone}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Lock className="w-3.5 h-3.5" /> Fund Escrow
                          </button>
                        )}
                        {isClient && milestone.status === 'submitted' && (
                          <button
                            onClick={() => setReviewingMilestoneId(milestone.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> Review
                          </button>
                        )}
                      </div>

                      {milestone.dueDate && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due: {formatDate(milestone.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Financial Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Financial Summary</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Contract Value', value: formatCurrency(contract.totalAmount), bold: true },
                { label: 'Escrow Amount', value: formatCurrency(contract.escrowAmount ?? 0) },
                { label: 'Platform Fee', value: `${contract.platformFeePercent}%` },
                { label: 'Net to Freelancer', value: formatCurrency(contract.totalAmount * (1 - (contract.platformFeePercent ?? 10) / 100)) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                  <span className={cn('font-medium text-gray-900 dark:text-white', item.bold && 'text-base font-bold')}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Parties */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Parties</h3>
            <div className="space-y-4">
              {[
                { label: 'Client', user: contract.client },
                { label: contract.agency ? 'Agency' : 'Freelancer', user: contract.freelancer, agency: contract.agency },
              ].map((party) => (
                <div key={party.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center overflow-hidden">
                    {party.user?.avatar ? (
                      <img src={party.user.avatar} alt="" className="w-10 h-10 object-cover" />
                    ) : (
                      <span className="text-nexus-600 dark:text-nexus-400 font-semibold text-xs">
                        {party.user?.firstName?.[0]}{party.user?.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{party.label}</p>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {party.agency?.name || `${party.user?.firstName} ${party.user?.lastName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Created', value: formatDate(contract.createdAt) },
                { label: 'Start Date', value: contract.startDate ? formatDate(contract.startDate) : 'Pending' },
                { label: 'End Date', value: contract.endDate ? formatDate(contract.endDate) : 'Open' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          {contract.completionPercentage !== undefined && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Progress</h3>
                <span className="font-bold text-nexus-600 dark:text-nexus-400">{contract.completionPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-nexus-600 rounded-full transition-all duration-500"
                  style={{ width: `${contract.completionPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {submitingMilestoneId && (
        <MilestoneSubmitModal
          milestoneId={submitingMilestoneId}
          onClose={() => setSubmittingMilestoneId(null)}
          onSuccess={() => { setSubmittingMilestoneId(null); refetchMilestones(); }}
        />
      )}
      {reviewingMilestoneId && (
        <MilestoneReviewModal
          milestoneId={reviewingMilestoneId}
          onClose={() => setReviewingMilestoneId(null)}
          onSuccess={() => { setReviewingMilestoneId(null); refetchMilestones(); }}
        />
      )}
    </div>
  );
}
