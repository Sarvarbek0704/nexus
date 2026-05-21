'use client';

import Link from 'next/link';
import { useGetMyStatsQuery } from '@/store/api/statsApi';
import { useGetMyContractsQuery } from '@/store/api/contractsApi';
import { useAppSelector } from '@/store';
import { StatCard } from './StatCard';
import { formatCurrency, formatRelativeTime, getStatusColor } from '@/lib/utils';
import {
  Building2, Users, FileText, DollarSign, ArrowRight,
  TrendingUp, Star, Send, CheckCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export function AgencyDashboard() {
  const { user } = useAppSelector((s) => s.auth);
  const { data: statsData } = useGetMyStatsQuery();
  const { data: contractsData } = useGetMyContractsQuery({ limit: 5, page: 1 });

  const stats = statsData?.data;
  const contracts = contractsData?.data?.items ?? [];
  const earningsData = stats?.monthlyBreakdown ?? [];

  const contractStatusData = [
    { name: 'Active', value: stats?.activeContracts ?? 0 },
    { name: 'Completed', value: stats?.completedContracts ?? 0 },
    { name: 'Pending', value: stats?.pendingContracts ?? 0 },
    { name: 'Disputed', value: stats?.disputedContracts ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Agency Overview 🏢
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your agency's projects and team.</p>
        </div>
        <Link
          href="/agencies/my-agency"
          className="flex items-center gap-2 px-4 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Building2 className="w-4 h-4" />
          My Agency
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Team Members"
          value={stats?.teamMembers ?? 0}
          subtitle="Active members"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Contracts"
          value={stats?.activeContracts ?? 0}
          subtitle="Ongoing projects"
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalEarned ?? 0)}
          subtitle="All time"
          icon={DollarSign}
          color="green"
          trend={{ value: 31, label: 'vs last month' }}
        />
        <StatCard
          title="Agency Rating"
          value={`${stats?.averageRating?.toFixed(1) ?? '0.0'} ★`}
          subtitle={`${stats?.totalReviews ?? 0} reviews`}
          icon={Star}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last 6 months</p>
            </div>
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +31% growth
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 8 }} />
              <Area type="monotone" dataKey="earned" stroke="#8b5cf6" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contract Status</h3>
          {contractStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={contractStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {contractStatusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">No contract data yet</div>
          )}
          <div className="mt-2 space-y-2">
            {[
              { label: 'Active Bids', value: stats?.activeBids ?? 0, icon: Send, color: 'text-blue-500' },
              { label: 'Bid Win Rate', value: `${stats?.bidWinRate?.toFixed(0) ?? 0}%`, icon: TrendingUp, color: 'text-emerald-500' },
              { label: 'Completed', value: stats?.completedContracts ?? 0, icon: CheckCircle, color: 'text-purple-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <item.icon className={cn('w-3.5 h-3.5', item.color)} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Contracts</h3>
          <Link href="/contracts" className="text-sm text-nexus-600 dark:text-nexus-400 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {contracts.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">No contracts yet.</div>
          )}
          {contracts.map((contract) => (
            <Link key={contract.id} href={`/contracts/${contract.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{contract.contractNumber}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{contract.project?.title}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(contract.totalAmount)}</p>
                <p className="text-xs text-gray-400">{formatRelativeTime(contract.createdAt)}</p>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(contract.status))}>
                {contract.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

