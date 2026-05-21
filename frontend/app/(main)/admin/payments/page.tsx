'use client';

import { useState } from 'react';
import { useGetTransactionHistoryQuery } from '@/store/api/paymentsApi';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import {
  DollarSign, ArrowUpRight, ArrowDownLeft, Loader2,
  Search, X, TrendingUp, TrendingDown, Shield, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_TABS = ['all', 'deposit', 'withdrawal', 'escrow_fund', 'escrow_release', 'refund'];

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; credit: boolean }> = {
  deposit: { label: 'Deposit', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: ArrowDownLeft, credit: true },
  withdrawal: { label: 'Withdrawal', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: ArrowUpRight, credit: false },
  escrow_fund: { label: 'Escrow Fund', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Shield, credit: false },
  escrow_release: { label: 'Escrow Release', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: TrendingUp, credit: true },
  refund: { label: 'Refund', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: TrendingDown, credit: true },
  platform_fee: { label: 'Platform Fee', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', icon: DollarSign, credit: false },
};

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useGetTransactionHistoryQuery({
    page,
    limit: 20,
    type: type !== 'all' ? type : undefined,
    search: search || undefined,
    admin: true,
  });

  const transactions = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  const totalVolume = transactions.reduce((sum: number, t: any) => sum + (t.amount ?? 0), 0);
  const totalDeposits = transactions.filter((t: any) => t.type === 'deposit').reduce((s: number, t: any) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter((t: any) => t.type === 'withdrawal').reduce((s: number, t: any) => s + t.amount, 0);
  const totalEscrow = transactions.filter((t: any) => t.type === 'escrow_fund').reduce((s: number, t: any) => s + t.amount, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Transactions</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor all platform financial activity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: formatCurrency(totalVolume), icon: DollarSign, color: 'text-nexus-500', bg: 'bg-nexus-50 dark:bg-nexus-950/30' },
          { label: 'Total Deposits', value: formatCurrency(totalDeposits), icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Withdrawals', value: formatCurrency(totalWithdrawals), icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
          { label: 'In Escrow', value: formatCurrency(totalEscrow), icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by user, reference..."
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
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transaction</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reference</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
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
                    <p className="text-sm">No transactions found</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => {
                  const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.deposit;
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
                            {tx.user?.firstName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {tx.user?.firstName} {tx.user?.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{tx.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{tx.reference ?? '—'}</p>
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
