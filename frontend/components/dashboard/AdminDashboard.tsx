"use client";

import Link from "next/link";
import { useGetPlatformStatsQuery } from "@/store/api/statsApi";
import { StatCard } from "./StatCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export function AdminDashboard() {
  const {
    data: platformStatsData,
    isLoading,
    isError,
  } = useGetPlatformStatsQuery();
  const stats = platformStatsData?.data;

  const growthData = stats?.monthlyGrowth ?? [];
  const revenueData = stats?.monthlyRevenue ?? [];

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
        Loading platform statistics...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-sm text-red-600 dark:text-red-400">
        Unable to load platform statistics. Please refresh or check your admin
        access.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Overview
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time platform statistics and health metrics.
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Activity className="w-4 h-4" />
          Admin Panel
        </Link>
      </div>

      {/* Alert Banner */}
      {(stats?.openDisputes ?? 0) > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {stats?.openDisputes} open dispute
            {stats?.openDisputes !== 1 ? "s" : ""} require attention.
          </p>
          <Link
            href="/admin/disputes"
            className="ml-auto text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
          >
            Review now →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(stats?.totalUsers ?? 0)}
          subtitle={`+${stats?.newUsersThisMonth ?? 0} this month`}
          icon={Users}
          color="blue"
          trend={{ value: 15, label: "vs last month" }}
        />
        <StatCard
          title="Total Projects"
          value={formatNumber(stats?.totalProjects ?? 0)}
          subtitle={`${stats?.activeProjects ?? 0} active`}
          icon={Briefcase}
          color="purple"
          trend={{ value: 8, label: "vs last month" }}
        />
        <StatCard
          title="Platform Revenue"
          value={formatCurrency(stats?.platformRevenue ?? 0)}
          subtitle="Total fees collected"
          icon={DollarSign}
          color="green"
          trend={{ value: 25, label: "vs last month" }}
        />
        <StatCard
          title="Active Disputes"
          value={stats?.openDisputes ?? 0}
          subtitle="Require resolution"
          icon={ShieldAlert}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Contracts
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatNumber(stats?.totalContracts ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.activeContracts ?? 0} currently active
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Paid Out
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(stats?.totalPaidOut ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            To freelancers & agencies
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Verified Freelancers
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatNumber(stats?.verifiedFreelancers ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Out of {formatNumber(stats?.totalFreelancers ?? 0)} total
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Agencies
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatNumber(stats?.totalAgencies ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.verifiedAgencies ?? 0} verified
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                User Growth
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New registrations per month
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#userGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Revenue Breakdown
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monthly platform fees
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v)]}
                contentStyle={{ borderRadius: 8 }}
              />
              <Legend />
              <Bar
                dataKey="fees"
                name="Platform Fees"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="volume"
                name="Total Volume"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Admin Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Manage Users",
            href: "/admin/users",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/30",
          },
          {
            label: "All Projects",
            href: "/admin/projects",
            icon: Briefcase,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/30",
          },
          {
            label: "Disputes",
            href: "/admin/disputes",
            icon: ShieldAlert,
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-950/30",
          },
          {
            label: "Payments",
            href: "/admin/payments",
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/30",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-200 dark:border-gray-800 ${item.bg} hover:shadow-card transition-shadow`}
          >
            <item.icon className={`w-6 h-6 ${item.color}`} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
