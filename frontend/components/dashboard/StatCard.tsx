import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    trend: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    trend: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    icon: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
    trend: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    icon: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
    trend: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    trend: 'text-red-600 dark:text-red-400',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', className }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className={cn('font-semibold', trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-gray-400 dark:text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
