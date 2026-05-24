'use client';

import { useState } from 'react';
import { useGetAllTransactionsQuery } from '@/store/api/paymentsApi';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import {
  DollarSign, ArrowUpRight, ArrowDownLeft, Loader2,
  Search, X, TrendingUp, TrendingDown, Shield, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const TYPE_TABS = ['all', 'milestone_payment', 'escrow_deposit', 'escrow_release', 'withdrawal', 'refund', 'platform_fee'];

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; credit: boolean }> = {
  milestone_payment: { label: 'Milestone Payment', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: ArrowDownLeft, credit: true },
  escrow_deposit: { label: 'Escrow Deposit', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Shield, credit: false },
  escrow_release: { label: 'Escrow Release', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: TrendingUp, credit: true },
  withdrawal: { label: 'Withdrawal', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: ArrowUpRight, credit: false },
  refund: { label: 'Refund', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: TrendingDown, credit: true },
  platform_fee: { label: 'Platform Fee', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', icon: DollarSign, credit: false },
  bonus: { label: 'Bonus', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: TrendingUp, credit: true },
};

export default function AdminPaymentsPage() {
  const t = useT();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useGetAllTransactionsQuery({
    page,
    limit: 20,
    type: type !== 'all' ? type : undefined,
    search: search || undefined,
  });

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  const totalVolume = transactions.reduce((sum: number, tx: any) => sum + Number(tx.amount ?? 0), 0);
  const totalDeposits = transactions.filter((tx: any) => tx.type === 'milestone_payment').reduce((s: number, tx: any) => s + Number(tx.amount), 0);
  const totalWithdrawals = transactions.filter((tx: any) => tx.type === 'withdrawal').reduce((s: number, tx: any) => s + Number(tx.amount), 0);
  const totalEscrow = transactions.filter((tx: any) => tx.type === 'escrow_deposit').reduce((s: number, tx: any) => s + Number(tx.amount), 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.adminExtended.payments.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t.adminExtended.payments.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.adminExtended.payments.totalVolume, value: formatCurrency(totalVolume), icon: DollarSign, color: 'text-nexus-500', bg: 'bg-nexus-50 dark:bg-nexus-950/30' },
          { label: t.adminExtended.payments.totalDeposits, value: formatCurrency(totalDeposits), icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: t.adminExtended.payments.withdrawals, value: formatCurrency(totalWithdrawals), icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
          { label: t.payments.escrowBalance, value: formatCurrency(totalEscrow), icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.bg)}>
              <card.icon className={cn('w-5 h-5', card.color)} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t.adminExtended.payments.search}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-900"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-wrap">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setType(tab); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                type === tab
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.adminExtended.payments.headers.transaction}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.adminExtended.payments.headers.user}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.adminExtended.payments.headers.reference}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.adminExtended.payments.headers.date}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.adminExtended.payments.headers.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-nexus-500 mx-auto" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400">
                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t.adminExtended.payments.noTransactions}</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => {
                  const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.platform_fee;
                  const Icon = cfg.icon;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                            <Icon className={cn('w-4 h-4', cfg.color)} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{cfg.label}</p>
                            {tx.description && (
                              <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{tx.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center text-xs font-bold text-nexus-600 dark:text-nexus-400 flex-shrink-0">
                            {(tx.payer ?? tx.user)?.firstName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {(tx.payer ?? tx.user)?.firstName} {(tx.payer ?? tx.user)?.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{(tx.payer ?? tx.user)?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{tx.transactionId ?? '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatRelativeTime(tx.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn('text-sm font-semibold', cfg.credit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                          {cfg.credit ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
