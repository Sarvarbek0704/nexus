'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetMyContractsQuery } from '@/store/api/contractsApi';
import { useAppSelector } from '@/store';
import { formatCurrency, formatDate, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { FileText, DollarSign, Calendar, Users, ArrowRight, Loader2, CheckCircle, Clock } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const STATUS_TABS = ['all', 'pending', 'active', 'paused', 'disputed', 'completed', 'cancelled'];

export default function ContractsPage() {
  const t = useT();
  const { user } = useAppSelector((s) => s.auth);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState('all');

  const { data, isLoading } = useGetMyContractsQuery({
    page,
    limit: 10,
    status: activeStatus === 'all' ? undefined : activeStatus,
  });

  const contracts = data?.data ?? [];
  const meta = data?.meta;

  const isClient = user?.role === 'client';

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.contracts.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t.contractDetail.back.replace('Back to ', 'Manage your active and past ')}</p>
      </div>

      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            onClick={() => { setActiveStatus(status); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
              activeStatus === status
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.contracts.noContracts.replace('.', ' found')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {activeStatus === 'all' ? t.contracts.noContracts : `No ${activeStatus} contracts.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const otherParty = isClient ? contract.freelancer : contract.client;
            const otherName = otherParty
              ? `${otherParty.firstName} ${otherParty.lastName}`
              : contract.agency?.name;

            return (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-card hover:border-nexus-200 dark:hover:border-nexus-800 transition-all"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {contract.contractNumber}
                        </p>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', getStatusColor(contract.status))}>
                          {contract.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-1 truncate">
                        {contract.project?.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {otherName && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {isClient ? t.contracts.freelancer : t.contracts.client}: {otherName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {t.contracts.startDate} {formatRelativeTime(contract.startDate || contract.createdAt)}
                        </span>
                        {contract.endDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {t.contractDetail.due}: {formatDate(contract.endDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(contract.totalAmount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {contract.escrowAmount ? `${formatCurrency(contract.escrowAmount)} ${t.contractDetail.inEscrow}` : t.contractDetail.noEscrow}
                    </p>
                    {contract.completionPercentage !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>{t.contractDetail.progress}</span>
                          <span>{contract.completionPercentage}%</span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-nexus-600 rounded-full transition-all"
                            style={{ width: `${contract.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {contract._count?.milestones ?? 0} {t.contracts.milestones}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {t.contractDetail.platformFee}: {contract.platformFeePercent}%
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-nexus-600 dark:text-nexus-400 font-medium">
                    {t.common.edit} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
