'use client';

import Link from 'next/link';
import { useGetMyStatsQuery } from '@/store/api/statsApi';
import { useGetMyBidsQuery } from '@/store/api/bidsApi';
import { useGetMyContractsQuery } from '@/store/api/contractsApi';
import { useAppSelector } from '@/store';
import { StatCard } from './StatCard';
import { formatCurrency, formatRelativeTime, getStatusColor } from '@/lib/utils';
import {
  Send, FileText, DollarSign, Star, ArrowRight,
  Clock, CheckCircle, TrendingUp, Briefcase, Search,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export function FreelancerDashboard() {
  const { user } = useAppSelector((s) => s.auth);
  const { data: statsData } = useGetMyStatsQuery();
  const { data: bidsData } = useGetMyBidsQuery({ limit: 5, page: 1 });
  const { data: contractsData } = useGetMyContractsQuery({ limit: 5, page: 1 });
  const t = useT();

  const stats = statsData?.data;
  const bids = bidsData?.data ?? [];
  const contracts = contractsData?.data ?? [];
  const earningsData = stats?.monthlyBreakdown ?? [];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t.dashboard.welcomeBack}, {user?.firstName}! 🚀
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t.dashboard.freelancerSub}</p>
        </div>
        <Link
          href="/projects"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors flex-shrink-0 w-full sm:w-auto"
        >
          <Search className="w-4 h-4" />
          {t.dashboard.findWork}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title={t.dashboard.activeBids}
          value={stats?.activeBids ?? 0}
          subtitle={t.dashboard.awaitingResponse}
          icon={Send}
          color="blue"
        />
        <StatCard
          title={t.dashboard.activeContracts}
          value={stats?.activeContracts ?? 0}
          subtitle={t.dashboard.inProgress}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title={t.dashboard.totalEarned}
          value={formatCurrency(stats?.totalEarned ?? 0)}
          subtitle={t.dashboard.allTime}
          icon={DollarSign}
          color="green"
          trend={{ value: 22, label: t.dashboard.vsLastMonth }}
        />
        <StatCard
          title={t.dashboard.avgRating}
          value={`${Number(stats?.averageRating || 0).toFixed(1)} ★`}
          subtitle={`${stats?.totalReviews ?? 0} ${t.nav.reviews}`}
          icon={Star}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{t.dashboard.monthlyEarnings}</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.dashboard.last6Months}</p>
            </div>
          </div>
          {earningsData.length === 0 || earningsData.every((d) => d.earned === 0) ? (
            <div className="flex flex-col items-center justify-center h-[160px] sm:h-[220px] text-gray-400">
              <DollarSign className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">{t.dashboard.noEarnings}</p>
              <p className="text-xs mt-1">{t.dashboard.noEarningsSub}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v: number) => [formatCurrency(v), t.dashboard.totalEarned]}
                />
                <Bar dataKey="earned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Performance */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">{t.dashboard.performance}</h3>
          <div className="space-y-3 sm:space-y-4">
            {[
              { label: t.dashboard.totalBidsSent, value: stats?.totalBidsSent ?? 0, icon: Send, color: 'text-blue-500' },
              { label: t.dashboard.bidWinRate, value: `${stats?.bidWinRate?.toFixed(0) ?? 0}%`, icon: TrendingUp, color: 'text-emerald-500' },
              { label: t.dashboard.completedJobs, value: stats?.completedContracts ?? 0, icon: CheckCircle, color: 'text-purple-500' },
              { label: t.dashboard.pendingMilestones, value: stats?.pendingMilestones ?? 0, icon: Clock, color: 'text-orange-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-2">
                  <item.icon className={cn('w-4 h-4 flex-shrink-0', item.color)} />
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t.dashboard.availableBalance}</span>
              <span className="font-bold text-nexus-600 dark:text-nexus-400">
                {formatCurrency(Number(user?.walletBalance ?? 0))}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t.dashboard.inEscrow}</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(Number(user?.escrowBalance ?? 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bids & Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{t.dashboard.recentBids}</h3>
            <Link href="/bids" className="text-xs sm:text-sm text-nexus-600 dark:text-nexus-400 hover:underline flex items-center gap-1">
              {t.dashboard.viewAll} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {bids.length === 0 && (
              <div className="p-4 sm:p-6 text-center text-gray-400 text-xs sm:text-sm">{t.dashboard.noBids}</div>
            )}
            {bids.map((bid) => (
              <Link key={bid.id} href={`/bids/${bid.id}`} className="flex items-start gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{bid.project?.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatCurrency(bid.bidAmount)} · {formatRelativeTime(bid.createdAt)}
                  </p>
                </div>
                <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0', getStatusColor(bid.status))}>
                  {bid.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{t.dashboard.activeContracts2}</h3>
            <Link href="/contracts" className="text-xs sm:text-sm text-nexus-600 dark:text-nexus-400 hover:underline flex items-center gap-1">
              {t.dashboard.viewAll} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {contracts.length === 0 && (
              <div className="p-4 sm:p-6 text-center text-gray-400 text-xs sm:text-sm">{t.dashboard.noContracts}</div>
            )}
            {contracts.map((contract) => (
              <Link key={contract.id} href={`/contracts/${contract.id}`} className="flex items-start gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{contract.contractNumber}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatCurrency(contract.totalAmount)} · {contract.client?.firstName} {contract.client?.lastName}
                  </p>
                </div>
                <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0', getStatusColor(contract.status))}>
                  {contract.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
