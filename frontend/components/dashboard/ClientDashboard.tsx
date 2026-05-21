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

export function ClientDashboard() {
  const { user } = useAppSelector((s) => s.auth);
  const { data: statsData } = useGetMyStatsQuery();
  const { data: projectsData } = useGetMyProjectsQuery({ limit: 5, page: 1 });
  const { data: contractsData } = useGetMyContractsQuery({ limit: 5, page: 1 });

  const stats = statsData?.data;
  const projects = projectsData?.data?.items ?? [];
  const contracts = contractsData?.data?.items ?? [];

  const spendingData = stats?.monthlyBreakdown ?? [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good morning, {user?.firstName}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your projects today.</p>
        </div>
        <Link
          href="/projects/post"
          className="flex items-center gap-2 px-4 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post a Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={stats?.activeProjects ?? 0}
          subtitle="Currently in progress"
          icon={Briefcase}
          color="blue"
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatCard
          title="Active Contracts"
          value={stats?.activeContracts ?? 0}
          subtitle="Ongoing engagements"
          icon={FileText}
          color="purple"
          trend={{ value: 5, label: 'vs last month' }}
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(stats?.totalSpent ?? 0)}
          subtitle="Lifetime payments"
          icon={DollarSign}
          color="green"
          trend={{ value: 18, label: 'vs last month' }}
        />
        <StatCard
          title="Freelancers Hired"
          value={stats?.totalFreelancersHired ?? 0}
          subtitle="Unique collaborators"
          icon={Users}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Spending</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last 6 months</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-4 h-4" />
              +18% this month
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={spendingData}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(v: number) => [formatCurrency(v), 'Spent']}
              />
              <Area type="monotone" dataKey="spent" stroke="#3b82f6" strokeWidth={2} fill="url(#spendGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Overview</h3>
          <div className="space-y-4">
            {[
              { label: 'Bids Received', value: stats?.totalBidsReceived ?? 0, icon: FileText, color: 'text-blue-500' },
              { label: 'Completed Projects', value: stats?.completedProjects ?? 0, icon: CheckCircle, color: 'text-emerald-500' },
              { label: 'Avg. Rating Given', value: `${stats?.averageRatingGiven?.toFixed(1) ?? '0.0'} ★`, icon: Star, color: 'text-yellow-500' },
              { label: 'Pending Milestones', value: stats?.pendingMilestones ?? 0, icon: Clock, color: 'text-orange-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-2.5">
                  <item.icon className={cn('w-4 h-4', item.color)} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Wallet Balance</span>
              <span className="font-bold text-nexus-600 dark:text-nexus-400 text-base">
                {formatCurrency(Number(user?.walletBalance ?? 0))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500 dark:text-gray-400">In Escrow</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(Number(user?.escrowBalance ?? 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects & Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Projects</h3>
            <Link href="/projects" className="text-sm text-nexus-600 dark:text-nexus-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {projects.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">No projects yet. Post your first project!</div>
            )}
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-nexus-600 dark:text-nexus-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {project._count?.bids ?? 0} bids · {formatRelativeTime(project.createdAt)}
                  </p>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0', getStatusColor(project.status))}>
                  {project.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Contracts */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Active Contracts</h3>
            <Link href="/contracts" className="text-sm text-nexus-600 dark:text-nexus-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {contracts.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">No active contracts.</div>
            )}
            {contracts.map((contract) => (
              <Link key={contract.id} href={`/contracts/${contract.id}`} className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contract.contractNumber}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatCurrency(contract.totalAmount)} · {contract.freelancer?.firstName} {contract.freelancer?.lastName}
                  </p>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0', getStatusColor(contract.status))}>
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

