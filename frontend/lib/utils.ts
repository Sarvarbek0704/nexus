import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, fmt = 'MMM dd, yyyy'): string {
  return format(new Date(date), fmt);
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'success',
    open: 'success',
    completed: 'info',
    paid: 'success',
    pending: 'warning',
    in_progress: 'info',
    submitted: 'info',
    under_review: 'warning',
    revision_requested: 'warning',
    accepted: 'success',
    shortlisted: 'info',
    rejected: 'destructive',
    cancelled: 'destructive',
    disputed: 'warning',
    terminated: 'destructive',
    withdrawn: 'muted',
    expired: 'muted',
    draft: 'muted',
    paused: 'warning',
    suspended: 'destructive',
    inactive: 'muted',
  };
  return colors[status] || 'muted';
}

export function formatProjectBudget(project: any): string {
  if (project.type === 'hourly') {
    const min = project.hourlyRateMin;
    const max = project.hourlyRateMax;
    if (min && max) return `$${min}-$${max}/hr`;
    if (min) return `From $${min}/hr`;
    return 'Hourly rate';
  }
  const min = project.budgetMin;
  const max = project.budgetMax;
  if (min && max) return `$${min.toLocaleString()}-$${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  return 'Budget TBD';
}

export function getRoleBadgeClass(role: string): string {
  const classes: Record<string, string> = {
    client: 'bg-emerald-100 text-emerald-700',
    freelancer: 'bg-blue-100 text-blue-700',
    agency_owner: 'bg-violet-100 text-violet-700',
    admin: 'bg-red-100 text-red-700',
  };
  return classes[role] || 'bg-gray-100 text-gray-700';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
