'use client';

import Link from 'next/link';
import { useGetMyStatsQuery } from '@/store/api/statsApi';
import { useGetMyProjectsQuery } from '@/store/api/projectsApi';
import { useGetMyContractsQuery } from '@/store/api/contractsApi';
import { useAppSelector } from '@/store';
import { StatCard } from './StatCard';
import { formatCurrency, formatRelativeTime, getStatusColor } from '@/lib/utils';
import {
  Briefcase, FileText, DollarSign, Users, Plus, ArrowRight,
  Clock, CheckCircle, TrendingUp, Star,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export function ClientDashboard() {
  const { user } = useAppSelector((s) => s.auth);
  const { data: statsData } = useGetMyStatsQuery();
  const { data: projectsData } = useGetMyProjectsQuery({ limit: 5, page: 1 });
  const { data: contractsData } = useGetMyContractsQuery({ limit: 5, page: 1 });
  const t = useT();

  const stats = statsData?.data;
  const projects = projectsData?.data ?? [];
  const contracts = contractsData?.data ?? [];
  const spendingData = stats?.monthlyBreakdown ?? [];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t.dashboard.welcomeBack}, {user?.firstName}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t.dashboard.clientSub}</p>
        </div>
        <Link
          href="/projects/post"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors flex-shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t.dashboard.postProject}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title={t.dashboard.activeProjects}
          value={stats?.activeProjects ?? 0}
          subtitle={t.dashboard.inProgress}
          icon={Briefcase}
          color="blue"
          trend={{ value: 12, label: t.dashboard.vsLastMonth }}
        />
        <StatCard
          title={t.dashboard.activeContracts}
          value={stats?.activeContracts ?? 0}
          subtitle={t.dashboard.inProgress}
          icon={FileText}
          color="purple"
          trend={{ value: 5, label: t.dashboard.vsLastMonth }}
        />
        <StatCard
          title={t.dashboard.totalSpent}
          value={formatCurrency(stats?.totalSpent ?? 0)}
          subtitle={t.dashboard.allTime}
          icon={DollarSign}
          color="green"
          trend={{ value: 18, label: t.dashboard.vsLastMonth }}
        />
        <StatCard
          title={t.nav.findFreelancers}
          value={stats?.totalFreelancersHired ?? 0}
          subtitle={t.dashboard.allTime}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Spending Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{t.payments.totalSpent}</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.dashboard.last6Months}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              +18%
            </div>
          </div>
          {spendingData.length === 0 || spendingData.every((d: any) => !d.spent) ? (
            <div className="flex flex-col items-center justify-center h-[160px] sm:h-[220px] text-gray-400">
              <DollarSign className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">{t.dashboard.noEarnings}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={spendingData}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v: number) => [formatCurrency(v), t.payments.totalSpent]}
                />
                <Area type="monotone" dataKey="spent" stroke="#3b82f6" strokeWidth={2} fill="url(#spendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">{t.dashboard.performance}</h3>
          <div className="space-y-3 sm:space-y-4">
            {[
              { label: t.dashboard.totalBidsSent, value: stats?.totalBidsReceived ?? 0, icon: FileText, color: 'text-blue-500' },
              { label: t.dashboard.completedJobs, value: stats?.completedProjects ?? 0, icon: CheckCircle, color: 'text-emerald-500' },
              { label: t.dashboard.avgRating, value: `${Number(stats?.averageRatingGiven || 0).toFixed(1)} ★`, icon: Star, color: 'text-yellow-500' },
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

      {/* Recent Projects & Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{t.dashboard.recentProjects}</h3>
            <Link href="/projects/my" className="text-xs sm:text-sm text-nexus-600 dark:text-nexus-400 hover:underline flex items-center gap-1">
              {t.dashboard.viewAll} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {projects.length === 0 && (
              <div className="p-4 sm:p-6 text-center text-gray-400 text-xs sm:text-sm">{t.dashboard.noProjects}</div>
            )}
            {projects.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="flex items-start gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-nexus-600 dark:text-nexus-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{project.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {project._count?.bids ?? 0} {t.projects.bids} · {formatRelativeTime(project.createdAt)}
                  </p>
                </div>
                <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0', getStatusColor(project.status))}>
                  {project.status}
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
            {contracts.map((contract: any) => (
              <Link key={contract.id} href={`/contracts/${contract.id}`} className="flex items-start gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{contract.contractNumber}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatCurrency(contract.totalAmount)} · {contract.freelancer?.firstName} {contract.freelancer?.lastName}
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
